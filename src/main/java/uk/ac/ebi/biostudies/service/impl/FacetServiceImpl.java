package uk.ac.ebi.biostudies.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.lucene.facet.*;
import org.apache.lucene.facet.taxonomy.FastTaxonomyFacetCounts;
import org.apache.lucene.search.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import uk.ac.ebi.biostudies.api.util.Constants;
import uk.ac.ebi.biostudies.api.util.DrillDownWrapper;
import uk.ac.ebi.biostudies.api.util.analyzer.AnalyzerManager;
import uk.ac.ebi.biostudies.auth.Session;
import uk.ac.ebi.biostudies.config.IndexConfig;
import uk.ac.ebi.biostudies.config.IndexManager;
import uk.ac.ebi.biostudies.config.TaxonomyManager;
import uk.ac.ebi.biostudies.service.FacetService;
import uk.ac.ebi.biostudies.service.QueryService;
import uk.ac.ebi.biostudies.service.TextService;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Created by ehsan on 09/03/2017.
 */

@Service
public class FacetServiceImpl implements FacetService {

    private Logger logger = LogManager.getLogger(FacetServiceImpl.class.getName());

    @Autowired
    IndexConfig indexConfig;
    @Autowired
    IndexManager indexManager;
    @Autowired
    TaxonomyManager taxonomyManager;
    @Autowired
    SecurityQueryBuilder securityQueryBuilder;
    @Autowired
    TextService textService;
    @Autowired
    AnalyzerManager analyzerManager;
    @Autowired
    QueryService queryService;

    public JsonNode getDimension(String collection, String dimension, String queryString, JsonNode facetAndFields) {
        Query queryWithoutFacet = null;
//        DrillDownWrapper queryAfterFacet = null;
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode facetJSON = mapper.createObjectNode();
        FacetsCollector facetsCollector = new FacetsCollector();
        try {
            JsonNode selectedFacets = facetAndFields.get("facets")==null?mapper.createObjectNode():facetAndFields.get("facets");
            JsonNode selectedFields = facetAndFields.get("fields")==null?mapper.createObjectNode():facetAndFields.get("fields");
            queryWithoutFacet = queryService.makeQuery(queryString, collection, selectedFields).getKey();
            queryWithoutFacet = securityQueryBuilder.applySecurity(queryWithoutFacet);
//            queryAfterFacet = applyFacets(queryWithoutFacet, selectedFacets);
            FacetsCollector.search(indexManager.getIndexSearcher(), queryWithoutFacet, Integer.MAX_VALUE, facetsCollector);
            Facets facets = new FastTaxonomyFacetCounts(taxonomyManager.getTaxonomyReader(), taxonomyManager.getFacetsConfig(), facetsCollector);
            Map<String, JsonNode> allValidFields = indexManager.getIndexEntryMap();
            JsonNode facet = allValidFields.getOrDefault(dimension, null);
            if(facet==null || facet.has(Constants.IndexEntryAttributes.PRIVATE) && facet.get(Constants.IndexEntryAttributes.PRIVATE).asBoolean() && Session.getCurrentUser()==null) {
                return facetJSON;
            }
            FacetResult childrenFacets = facets.getTopChildren(Integer.MAX_VALUE, dimension);
            List<JsonNode> children = new ArrayList<>();//mapper.createArrayNode();
            facetJSON.put(Constants.IndexEntryAttributes.TITLE, facet.get(Constants.IndexEntryAttributes.TITLE).asText());
            facetJSON.put(Constants.IndexEntryAttributes.NAME, facet.get(Constants.IndexEntryAttributes.NAME).asText());
            //boolean ignoreHapaxLegomena = dimension.equalsIgnoreCase(Constants.Facets.FILE_TYPE) || dimension.equalsIgnoreCase(Constants.Facets.LINK_TYPE);
            if (childrenFacets!=null) {
                for (LabelAndValue labelVal : childrenFacets.labelValues) {
                    //if (ignoreHapaxLegomena && labelVal.value.intValue()==1) continue;
                    ObjectNode child = mapper.createObjectNode();
                    child.put("name", textService.getNormalisedString(labelVal.label));
                    child.put("value", labelVal.label);
                    child.put("hits", labelVal.value.intValue());
                    children.add(child);
                }
            }
            logger.debug("returning {} children", children.size());
            Collections.sort(children, Comparator.comparing(o -> o.get("name").textValue()));
            facetJSON.set("children", mapper.createArrayNode().addAll(children));


        } catch (Exception e) {
            logger.debug("problem in parsing collection {} dimension {}", collection, dimension, e);
        } catch (Throwable e) {
            logger.debug("problem in parsing collection {} dimension {}", collection, dimension, e);
        }

        return facetJSON;
    }

    @Override
    public List<FacetResult> getFacetsForQuery(DrillDownWrapper queryWrapper, int limit, Map<String, Map<String, Integer>> selectedFacetFreq, JsonNode selectedFacets) {
        Map<String, DrillDownQuery> drillDownQueries = queryWrapper.generateDrillDownQueries();
        FacetsCollector drillDownFacetCollector;
        Facets drillDownFacets;
        Map<String, Facets> perDimFacet = new HashMap<>(drillDownQueries.size());

        List<FacetResult> allResults = new ArrayList<>();
        Facets applyFacet = null;

        try {
            int tempLimit= limit;
            for(String dimKey:drillDownQueries.keySet()){
                drillDownFacetCollector = new FacetsCollector();
                FacetsCollector.search(indexManager.getIndexSearcher(), drillDownQueries.get(dimKey), limit, drillDownFacetCollector);
                drillDownFacets = new FastTaxonomyFacetCounts(taxonomyManager.getTaxonomyReader(), taxonomyManager.getFacetsConfig(), drillDownFacetCollector);
                perDimFacet.put(dimKey, drillDownFacets);
            }

            for (JsonNode field:indexManager.getIndexEntryMap().values()) {
                if(field.get(Constants.IndexEntryAttributes.FIELD_TYPE).asText().equalsIgnoreCase(Constants.IndexEntryAttributes.FieldTypeValues.FACET)){
                    // Private fields (e.g.modification_year) are available only to users of a collection with unreleased submissions e.g.
                    if(field.has(Constants.IndexEntryAttributes.PRIVATE) && field.get(Constants.IndexEntryAttributes.PRIVATE).asBoolean() && Session.getCurrentUser()==null) {
                        continue;
                    }
                    applyFacet = perDimFacet.get(field.get(Constants.IndexEntryAttributes.NAME).asText());
                    if(applyFacet==null) {
                        applyFacet = perDimFacet.get(Constants.IndexEntryAttributes.DEFAULT_VALUE);
                    }
                    tempLimit = field.get(Constants.IndexEntryAttributes.NAME).asText().equalsIgnoreCase(Constants.Facets.RELEASED_YEAR_FACET)?Integer.MAX_VALUE:limit;
                    allResults.add(applyFacet.getTopChildren(tempLimit, field.get(Constants.IndexEntryAttributes.NAME).asText()));
                }
            }
        } catch (IOException e) {
            logger.debug("problem in creating facetresults for this query {}", queryWrapper.getDrillDownQuery(), e);
        } catch (Throwable e) {
            logger.debug("problem in applying security in creating facetresults for this query {}", queryWrapper.getDrillDownQuery(), e);
        }
        addLowFreqSelectedFacets(selectedFacetFreq, selectedFacets, perDimFacet);
        return allResults;
    }

    /**
     * sending data for ui to add selected low frequency facets freq
     */
    private void addLowFreqSelectedFacets( Map<String, Map<String, Integer>> selectedFacetFreq, JsonNode selectedFacets, Map<String, Facets> perDimFacets){
        Iterator<String> fieldNamesIterator = selectedFacets.fieldNames();
        String dim="";
        String path ="";
        int freq = 0;
        while(fieldNamesIterator.hasNext()) {
            dim = fieldNamesIterator.next();
            Facets curDimFacets = perDimFacets.get(dim);
            if (curDimFacets ==null || dim == null)
                continue;
            ArrayNode field = (ArrayNode) selectedFacets.get(dim);
            if (field == null)
                continue;
            Iterator<JsonNode> iterator = field.elements();
            Map<String, Integer>freqForDim = selectedFacetFreq.get(dim)==null? new HashMap<>(): selectedFacetFreq.get(dim);
            selectedFacetFreq.put(dim, freqForDim);
            while (iterator.hasNext()) {
                path = iterator.next().asText();
                if(path==null || path.isEmpty())
                    continue;
                try {
                    freq = curDimFacets.getSpecificValue(dim, path).intValue();
                    freqForDim.put(path, freq);
                } catch (Throwable e) {
                    logger.debug("problem in getSpecificValue", e);
                }
            }
        }
    }

    @Override
    public JsonNode getDefaultFacetTemplate(String prjName, String queryString, int limit, JsonNode selectedFacetsAndFields){
        Query queryWithoutFacet = null;
        DrillDownWrapper queryAfterFacet = null;
        int hits = 0;
        ObjectMapper mapper = new ObjectMapper();
        JsonNode selectedFacets = selectedFacetsAndFields.get("facets")==null?mapper.createObjectNode():selectedFacetsAndFields.get("facets");
        JsonNode selectedFields = selectedFacetsAndFields.get("fields")==null?mapper.createObjectNode():selectedFacetsAndFields.get("fields");
        try {
            queryWithoutFacet = queryService.makeQuery(queryString, prjName, selectedFields).getKey();
            queryWithoutFacet = securityQueryBuilder.applySecurity(queryWithoutFacet);
            queryAfterFacet = applyFacets(queryWithoutFacet, selectedFacets);
        } catch (Throwable e) {
            logger.debug("problem in parsing query {}", queryString, e);
        }

        Map<String, Map<String, Integer>> selectedFacetFreq = new HashMap<>();
        List<FacetResult> facetResultsWithSelectedFacets = getFacetsForQuery(queryAfterFacet, limit, selectedFacetFreq, selectedFacets);
        HashMap<String, LabelAndValue> facetTemplateHash = new HashMap<>();
        for(FacetResult fc:facetResultsWithSelectedFacets) {
            if(fc!=null)
                for(LabelAndValue lAndB : fc.labelValues)
                    facetTemplateHash.put(fc.dim+lAndB.label, lAndB);
        }
        List<ObjectNode> list = new ArrayList<>();
        Set<String> validFacets = indexManager.getCollectionRelatedFields(prjName.toLowerCase());
        for (FacetResult fcResult : facetResultsWithSelectedFacets) {
            if (fcResult == null || !validFacets.contains(fcResult.dim)) {
                continue;
            }
            ObjectNode facet = mapper.createObjectNode();
            JsonNode facetNode = indexManager.getIndexEntryMap().get(fcResult.dim);
            // show collection facet only when the current collection has sub-collections
            if (!prjName.equalsIgnoreCase(Constants.PUBLIC)
                    && facetNode.get("name")!=null
                    && facetNode.get("name").asText().equalsIgnoreCase(Constants.Facets.COLLECTION)
                    &&  !indexManager.getSubCollectionMap().containsKey(prjName.toLowerCase())) {
                continue;
            }
            boolean invisibleNA = false;
            String naDefaultStr = Constants.NA;
            if(facetNode.has(Constants.IndexEntryAttributes.NA_IS_VISIBLE) && !facetNode.get(Constants.IndexEntryAttributes.NA_IS_VISIBLE).asBoolean(false))
                invisibleNA = true;
            if(facetNode.has(Constants.IndexEntryAttributes.DEFAULT_VALUE))
                naDefaultStr = facetNode.get(Constants.IndexEntryAttributes.DEFAULT_VALUE).asText();
            facet.put(Constants.IndexEntryAttributes.TITLE, facetNode.get(Constants.IndexEntryAttributes.TITLE).asText());
            facet.put(Constants.IndexEntryAttributes.NAME, facetNode.get(Constants.IndexEntryAttributes.NAME).asText());
            if (facetNode.has(Constants.IndexEntryAttributes.FACET_TYPE)) {
                facet.put ("type", facetNode.get(Constants.IndexEntryAttributes.FACET_TYPE).asText());
            }
            List<ObjectNode> children = new ArrayList<>();
            addSelectedFacetsToResponse(children, selectedFacetFreq.get(fcResult.dim));
            for (LabelAndValue labelVal : fcResult.labelValues) {
                if(invisibleNA && labelVal.label.equalsIgnoreCase(naDefaultStr))
                    continue;
                if(selectedFacetFreq.containsKey(fcResult.dim) && selectedFacetFreq.get(fcResult.dim).containsKey(labelVal.label))
                    continue;
                ObjectNode child = mapper.createObjectNode();
                child.put("name", textService.getNormalisedString(labelVal.label));
                child.put("value", labelVal.label);
                hits = labelVal.value.intValue();
                child.put("hits", hits);
                children.add(child);
            }
            Collections.sort(children, Comparator.comparing(o -> o.get("name").textValue()));
            if(facet.get("name").asText().equalsIgnoreCase(Constants.Facets.RELEASED_YEAR_FACET)) {
                Collections.reverse(children);
                if(children.size()>limit) {
                    if(children.get(0).get("name").asText().equalsIgnoreCase("N/A"))
                        children.remove(0);
                    children = children.stream().limit(limit).collect(Collectors.toList());
                }
            }
            ArrayNode childrenArray = mapper.createArrayNode();
            childrenArray.addAll(children);
            facet.set("children", childrenArray);
            list.add(facet);
        }
        //Collections.sort(list, Comparator.comparing(o -> o.get("title").textValue()));
        return mapper.createArrayNode().addAll(list);
    }

    private void addSelectedFacetsToResponse(List<ObjectNode> children, Map<String, Integer> freqMap){
        if(freqMap == null)
            return;
        ObjectMapper mapper = new ObjectMapper();
        for(String path:freqMap.keySet()){
            ObjectNode child = mapper.createObjectNode();
            child.put("name", textService.getNormalisedString(path));
            child.put("value", path);
            child.put("hits", freqMap.get(path));
            children.add(child);
        }
    }

    @Override
    public DrillDownWrapper addFacetDrillDownFilters(Query primaryQuery, Map<JsonNode, List<String>> userSelectedDimValues){
    /*
            BooleanQuery.Builder bQueryBuilder = new BooleanQuery.Builder();
            bQueryBuilder.add(primaryQuery, BooleanClause.Occur.MUST);
            for(JsonNode facet: userSelectedDimValues.keySet()) {
                if (facet==null || !facet.get(Constants.IndexEntryAttributes.FIELD_TYPE).asText().  equalsIgnoreCase(Constants.IndexEntryAttributes.FieldTypeValues.FACET))
                    continue;
                List<String> listSelectedValues = userSelectedDimValues.get(facet);
                if(listSelectedValues!=null) {
                    for (String value : listSelectedValues) {
                        FacetQuery facetQuery = new FacetQuery(taxonomyManager.getFacetsConfig(), facet.get(Constants.IndexEntryAttributes.NAME).asText(),  value.toLowerCase());
                        bQueryBuilder.add(facetQuery, BooleanClause.Occur.MUST);
                    }
                }
            }
            return bQueryBuilder.build();
    */
        DrillDownWrapper drillDownWrapper = new DrillDownWrapper(taxonomyManager.getFacetsConfig(), primaryQuery);
        DrillDownQuery drillDownQuery = new DrillDownQuery(taxonomyManager.getFacetsConfig(), primaryQuery);
        for(JsonNode facet: userSelectedDimValues.keySet()) {
            if (facet==null || !facet.get(Constants.IndexEntryAttributes.FIELD_TYPE).asText().equalsIgnoreCase(Constants.IndexEntryAttributes.FieldTypeValues.FACET))
                continue;
            List<String> listSelectedValues = userSelectedDimValues.get(facet);
            if(listSelectedValues!=null)
                for(String value:listSelectedValues) {
                    drillDownQuery.add(facet.get(Constants.IndexEntryAttributes.NAME).asText(), value.toLowerCase());
                    drillDownWrapper.addDim(facet.get(Constants.IndexEntryAttributes.NAME).asText(), value.toLowerCase());
                }
        }
        drillDownWrapper.setDrillDownQuery(drillDownQuery);
        return drillDownWrapper;
    }

    public DrillDownWrapper applyFacets(Query query, JsonNode facets){
        Map<JsonNode, List<String>> selectedFacets = new HashMap<>();
        if(facets!=null){
            Iterator<String> fieldNamesIterator = facets.fieldNames();
            String dim="";
            while(fieldNamesIterator.hasNext()){
                try {
                    dim = fieldNamesIterator.next();
                    if(dim==null)
                        continue;
                    JsonNode field = indexManager.getIndexEntryMap().get(dim);
                    JsonNode arrNode = facets.get(dim);
                    List<String> facetNames = new ArrayList<>();
                    if(arrNode==null)
                        continue;
                    selectedFacets.put(field, facetNames);
                    if(arrNode.isArray())
                        for (final JsonNode objNode : arrNode)
                        {
                            facetNames.add(objNode.textValue());
                        }
                }catch (Throwable ex){
                    logger.debug("Invalid facet: {}", dim, ex);
                }
            }
        }
        return  addFacetDrillDownFilters(query, selectedFacets);
    }
}
