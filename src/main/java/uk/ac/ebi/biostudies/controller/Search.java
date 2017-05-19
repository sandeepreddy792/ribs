package uk.ac.ebi.biostudies.controller;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.commons.lang.StringUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import uk.ac.ebi.biostudies.service.FacetService;
import uk.ac.ebi.biostudies.service.SearchService;
import java.net.URLDecoder;
import java.util.*;


import static java.nio.charset.StandardCharsets.UTF_8;
import static uk.ac.ebi.biostudies.api.util.Constants.JSON_UNICODE_MEDIA_TYPE;

/**
 * Created by awais on 14/02/2017.
 */
@RestController
@RequestMapping(value="/api")
public class Search {

    private Logger logger = LogManager.getLogger(Search.class.getName());


    @Autowired
    SearchService searchService;
    @Autowired
    FacetService facetService;

    @RequestMapping(value = "/search", produces = JSON_UNICODE_MEDIA_TYPE, method = RequestMethod.GET)
    public String search(@RequestParam(value="query", required=false, defaultValue = "*:*") String queryString,
                                        @RequestParam(value="page", required=false, defaultValue = "1") Integer page,
                                        @RequestParam(value="pageSize", required=false, defaultValue = "20") Integer pageSize,
                                        @RequestParam(value="sortBy", required=false, defaultValue = "relevance") String sortBy,
                                        @RequestParam(value="sortOrder", required=false, defaultValue = "descending") String sortOrder
    ) throws Exception {
        return searchService.search(URLDecoder.decode(queryString, String.valueOf(UTF_8)), null, null, page, pageSize, sortBy, sortOrder);
//        return new ResponseEntity<String>(response.toString(), HttpStatus.OK);
    }

    @RequestMapping(value = "/{project}/search", produces = JSON_UNICODE_MEDIA_TYPE, method = RequestMethod.GET)
    public String getSelectedFacets(@RequestParam(value="query", required=false, defaultValue = "") String queryString,
                                           @RequestParam(value="facets", required=false) String facets,
                                           @RequestParam(value="page", required=false, defaultValue = "1") Integer page,
                                           @RequestParam(value="pageSize", required=false, defaultValue = "20") Integer pageSize,
                                           @RequestParam(value="sortBy", required=false, defaultValue = "relevance") String sortBy,
                                           @RequestParam(value="sortOrder", required=false, defaultValue = "descending") String sortOrder,
                                           @PathVariable String project) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode selectedFacets = mapper.createObjectNode();
        if (facets!=null) {
            for (String facet : StringUtils.split(facets, ",")) {
                String[] parts = facet.split(":");
                if (parts.length != 2) continue;
                if (!selectedFacets.has(parts[0])) {
                    selectedFacets.set(parts[0], mapper.createArrayNode());
                }
                ((ArrayNode) selectedFacets.get(parts[0])).add(parts[1]);
            }
        }
        return searchService.search(URLDecoder.decode(queryString, String.valueOf(UTF_8)), selectedFacets, project, page, pageSize, sortBy, sortOrder);
    }

    @RequestMapping(value = "/{project}/facets", produces = JSON_UNICODE_MEDIA_TYPE , method = RequestMethod.GET)
    public String getDefaultFacets(@PathVariable String project) throws Exception{
        return facetService.getDefaultFacetTemplate(project).toString();
    }
}
