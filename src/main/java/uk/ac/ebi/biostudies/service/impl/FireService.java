package uk.ac.ebi.biostudies.service.impl;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.ObjectListing;
import com.amazonaws.services.s3.model.S3Object;
import org.apache.commons.lang3.StringUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import uk.ac.ebi.biostudies.config.FireConfig;
import uk.ac.ebi.biostudies.file.download.FIREDownloadFile;
import uk.ac.ebi.biostudies.file.download.IDownloadFile;

import java.io.ByteArrayInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Stack;
import java.util.stream.Collectors;

@Service
public class FireService {
    private final Logger logger = LogManager.getLogger(FireService.class);
    @Autowired
    FireConfig fireConfig;
    @Autowired
    @Qualifier("S3DownloadClient")
    AmazonS3 s3DownloadClient;

    @Autowired
    @Qualifier("S3MageTabClient")
    AmazonS3 s3MageTabClient;

    public IDownloadFile getFireFile(String accession, String relativePath, String requestedFilePath) throws  FileNotFoundException {
        return getFireFile(accession, relativePath, requestedFilePath, false);
    }

    public IDownloadFile getFireFile(String accession, String relativePath, String requestedFilePath, boolean isThumbnail) throws FileNotFoundException {

        String path = relativePath + (isThumbnail ? "/Thumbnails/" : "/Files/") + requestedFilePath + (isThumbnail ? ".thumbnail.png" : "");

        // For study json/xml/tsv pagetab files
        if (requestedFilePath.equals(accession + ".json") || requestedFilePath.equals(accession + ".xml") || requestedFilePath.equals(accession + ".tsv")) {
            path = relativePath + "/" + requestedFilePath;
        }

        S3Object fireObject = null;
        boolean isDirectory = false;
        try {
            logger.debug("accessing s3DownloadClient {}", path);
            fireObject = getFireObjectByPath(s3DownloadClient, path);
        } catch (Exception ex1) {
            try {
                if(fireObject!=null)
                    fireObject.close();
                if (requestedFilePath.equals(accession + ".tsv")) {
                    logger.debug("{} not found. Trying old .pagetab.tsv file.", path);
                    path = relativePath + "/" + accession + ".pagetab.tsv";
                } else {
                    logger.debug("{} not found and might be a folder. Trying zipped archive.", path);
                    isDirectory = true;
                    path = path + ".zip";
                }
                // For folders
                logger.debug("accessing s3DownloadClient {}", path);
                fireObject = getFireObjectByPath(s3DownloadClient, path);
            } catch (Exception ex4) {
                try {
                    if(fireObject!=null)
                        fireObject.close();
                }catch (Exception exception){
                    logger.debug("can not close fire pool http connection");
                }
                throw new FileNotFoundException(ex4.getMessage());
            }
        }
        return new FIREDownloadFile(path, fireObject.getObjectContent(), fireObject.getObjectMetadata().getContentLength(), isDirectory);
    }

    /**
     * This method load file from Fire to Ram and is just suitable for small files
     * Do not use this method for downloading submission attached files from fire
     *
     * @return
     */
    public InputStream cloneFireS3ObjectStream(String path) throws IOException {
        logger.debug("accessing s3MageTabClient {}", path);
        S3Object s3Object = null;
        ByteArrayInputStream fireCloneInputStream = null;
        try {
            s3Object = getFireObjectByPath(s3MageTabClient, path);
            fireCloneInputStream = new ByteArrayInputStream(s3Object.getObjectContent().readAllBytes());
        } catch (Exception exception) {
            logger.error(exception);
            if (exception.getMessage() != null && exception.getMessage().contains("Not Found"))
                throw new FileNotFoundException(exception.getMessage());
            return null;
        } finally {
            if (s3Object != null) try {
                s3Object.close();
            } catch (Exception exception) {
                logger.debug("Problem in closing fire object", exception);
            }

        }
        return fireCloneInputStream;
    }

    public S3Object getFireObjectByPath(AmazonS3 s3, String path) throws FileNotFoundException {
        String bucketName = fireConfig.getBucketName();
        GetObjectRequest getObjectRequest = new GetObjectRequest(bucketName, path);
        return s3.getObject(getObjectRequest);
    }


    public Stack<String> getAllDirectoryContent(List<String> pathNameList) throws Exception {
        Stack<String> allFileResult = new Stack<>();
        if (pathNameList == null || pathNameList.size() == 0) {
            return allFileResult;
        }
        allFileResult.addAll(pathNameList.stream().filter(path -> StringUtils.substringAfterLast(path, "/").contains(".")).collect(Collectors.toList()));

        Stack<String> subDirectoriesStack = new Stack<>();

        subDirectoriesStack.addAll(pathNameList.stream().filter(path -> !StringUtils.substringAfterLast(path, "/").contains(".")).collect(Collectors.toList()));
        try {
            while (subDirectoriesStack.size() > 0) {
                String currentPath = subDirectoriesStack.pop();
                ObjectListing objectListing = s3DownloadClient.listObjects(fireConfig.getBucketName(), currentPath);
                do {
                    allFileResult.addAll(objectListing.getObjectSummaries().stream().map(sum -> sum.getKey()).collect(Collectors.toList()));
                    List<String> embeddedDirectories = objectListing.getCommonPrefixes();
                    subDirectoriesStack.addAll(embeddedDirectories);
                } while (objectListing.isTruncated());
            }
        } catch (Exception exception) {
            logger.error(exception);
        }
        return allFileResult;
    }

    public boolean isValidFolder(String path) {
        boolean isFolder = false;
        try {
            ObjectListing objectListing = s3DownloadClient.listObjects(fireConfig.getBucketName(), path);
            isFolder = objectListing.getMaxKeys() > 0;
        } catch (Exception e) {

        }
        return isFolder;
    }
}