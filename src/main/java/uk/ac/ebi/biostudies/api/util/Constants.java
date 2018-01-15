package uk.ac.ebi.biostudies.api.util;

import org.springframework.http.MediaType;

/**
 * Created by ehsan on 30/03/2017.
 */
public interface Constants {
    String RELEASE_DATE = "release_date";
    String RELEVANCE = "relevance";
    String YEAR = "year";

    String SORT_ORDER = "sortorder";
    String ASCENDING = "ascending";
    String DESCENDING = "descending";
    String ACCESSION = "accession";
    String TITLE = "title";
    String AUTHORS = "authors";
    String LINKS = "links";
    String FILES = "files";
    String STUDIES_JSON_FILE = "studies.json";
    String JSON_UNICODE_MEDIA_TYPE = MediaType.APPLICATION_JSON_UTF8_VALUE;
    String STRING_UNICODE_MEDIA_TYPE = MediaType.TEXT_PLAIN_VALUE+";charset=UTF-8";
    String ID = "id";
    String TYPE = "type";
    String CONTENT = "content";
    String ACCESS = "access";
    String PROJECT = "project";
    String SECRET_KEY = "seckey";
    String LINK_TYPE = "linktype";
    String CREATION_TIME = "ctime";
    String RDATE_LONG = "rdatelong";
    String NA = "n/a";
    String PUBLIC = "public";
    String RELEASE_TIME = "rtime";
    String MODIFICATION_TIME="mtime";
    String MODIFICATION_TIME_FACET="mtimeFacet";
}
