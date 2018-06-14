package uk.ac.ebi.biostudies.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.lucene.analysis.core.KeywordAnalyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.index.IndexReader;
import org.apache.lucene.queryparser.classic.MultiFieldQueryParser;
import org.apache.lucene.queryparser.classic.ParseException;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.search.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import uk.ac.ebi.biostudies.api.util.Constants;
import uk.ac.ebi.biostudies.api.util.DataTableColumnInfo;
import uk.ac.ebi.biostudies.api.util.StudyUtils;
import uk.ac.ebi.biostudies.config.IndexManager;
import uk.ac.ebi.biostudies.config.SecurityConfig;
import uk.ac.ebi.biostudies.service.FilePaginationService;
import java.util.Map;

@Service
public class FilePaginationServiceImpl implements FilePaginationService {

    @Autowired
    IndexManager indexManager;
    private Logger logger = LogManager.getLogger(FilePaginationServiceImpl.class.getName());

    @Autowired
    SecurityConfig securityConfig;

    public String getColumns(String accession) {
        return getColumnsAsArrayNode(accession).toString();
    }

    private ArrayNode getColumnsAsArrayNode(String accession){
        ObjectMapper mapper = new ObjectMapper();
        ArrayNode arrNode = mapper.createArrayNode();
        String attFiles = getFileAttributesForDocument(accession);
        String allAtts[] = attFiles.split("\\|");
        for(String att:allAtts) {
            if (att.isEmpty())
                continue;
            ObjectNode node = mapper.createObjectNode();
            node.put("name", att);
            node.put("title", att);
            node.put("visible", true);
            att = att.replaceAll(" ", "_");
            node.put("data", att);
            node.put("defaultContent", "");
            arrNode.add(node);
        }
        return arrNode;
    }

    @Override
    public String getFileList(String accession, int start, int pageSize, String search, int draw, Map<Integer, DataTableColumnInfo> dataTableUiResult){
        IndexSearcher searcher = indexManager.getIndexSearcher();
        QueryParser parser = new QueryParser(Constants.Fields.ACCESSION, new KeywordAnalyzer());
        ObjectMapper mapper = new ObjectMapper();
        IndexReader reader = indexManager.getIndexReader();
        ArrayNode columns = getColumnsAsArrayNode(accession);
        try {
            SortField allSortedFields[] = new SortField[dataTableUiResult.size()];
            int counter = 0;
            for(DataTableColumnInfo ftInfo:dataTableUiResult.values()){
                allSortedFields[counter++] =  ftInfo.getName().equalsIgnoreCase("size")? new SortedNumericSortField(Constants.File.FILE_ATTS+ftInfo.getName(),SortField.Type.LONG, ftInfo.getDir().equalsIgnoreCase("desc")?true:false)
                        : new SortField(Constants.File.FILE_ATTS+ftInfo.getName(), SortField.Type.STRING, ftInfo.getDir().equalsIgnoreCase("desc")?true:false);
            }
            Sort sort = new Sort(allSortedFields);
            Query query = parser.parse(Constants.File.OWNER+":"+accession);
            if(search!=null && !search.isEmpty())
                query = applySearch(search, query, columns);
            TopDocs hits = searcher.search(query, Integer.MAX_VALUE , sort);
            ObjectNode response = mapper.createObjectNode();
            response.put(Constants.File.DRAW, draw);
            response.put(Constants.File.RECORDTOTAL, hits.totalHits);
            response.put(Constants.File.RECORDFILTERED, hits.totalHits);
            if (hits.totalHits >= 0) {
                ArrayNode docs = mapper.createArrayNode();
                for (int i = start; i < start+pageSize && i<hits.totalHits; i++) {
                    ObjectNode docNode = mapper.createObjectNode();
                    Document doc = reader.document(hits.scoreDocs[i].doc);
                    for(JsonNode field:columns){
                        String fName = Constants.File.FILE_ATTS+field.get("name").asText();
                        docNode.put(field.get("name").asText().replaceAll(" ", "_"), doc.get(fName)==null?"":doc.get(fName));
                    }
                    docs.add(docNode);
                }
                response.set(Constants.File.DATA, docs);
                return response.toString();
            }


        }catch (Exception ex){
            logger.debug("problem in file atts preparation", ex);
        }
        return  mapper.createObjectNode().toString();
    }

    private String getFileAttributesForDocument(String accession){
        String queryStr = Constants.Fields.ACCESSION+":"+accession.toLowerCase();
        QueryParser parser = new QueryParser(Constants.Fields.ACCESSION, new KeywordAnalyzer());
        try {
            Query query = parser.parse(queryStr);
            TopDocs resultDoc = indexManager.getIndexSearcher().search(query, 1);
            if(resultDoc.totalHits>0)
            {
                Document result = indexManager.getIndexReader().document(resultDoc.scoreDocs[0].doc);
                return result.get(Constants.File.FILE_ATTS);
            }
        } catch (Exception e) {
            logger.error("bad accession parsing for file attributes", e);
        }
        return "";
    }

    private Query applySearch(String search, Query firstQuery, ArrayNode columns){
        BooleanQuery.Builder builderSecond = new BooleanQuery.Builder();
        BooleanClause.Occur[] occurs = new  BooleanClause.Occur[columns.size()];
        String[] fields = new String[columns.size()];
        try {
            int counter = 0;
            for(JsonNode field:columns){
               String fName = QueryParser.escape(Constants.File.FILE_ATTS+field.get("name").asText());
               fields[counter] = fName;
               occurs[counter] = BooleanClause.Occur.SHOULD;
               counter++;
            }
            MultiFieldQueryParser parser = new MultiFieldQueryParser(fields, new KeywordAnalyzer());

            parser.setAllowLeadingWildcard(true);
            parser.setLowercaseExpandedTerms(false);
            Query tempSmallQuery = parser.parse(StudyUtils.escape("*"+search+"*"));
            logger.debug(tempSmallQuery);
            builderSecond.add(firstQuery, BooleanClause.Occur.MUST);
            builderSecond.add(tempSmallQuery, BooleanClause.Occur.MUST);
        } catch (ParseException e) {
            logger.debug("File Searchable Query Parser Exception", e);
        }
        logger.debug("query is: {}", builderSecond.build().toString());
        return builderSecond.build();
    }
}