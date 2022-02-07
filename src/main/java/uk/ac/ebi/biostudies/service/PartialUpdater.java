package uk.ac.ebi.biostudies.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.HttpHost;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import uk.ac.ebi.biostudies.auth.UserSecurityService;
import uk.ac.ebi.biostudies.config.SecurityConfig;

import java.io.IOException;

@Component
@Order()
public class PartialUpdater {

    private final Logger LOGGER = LogManager.getLogger(PartialUpdater.class.getName());
    @Autowired
    IndexService indexService;
    @Autowired
    SecurityConfig securityConfig;

    @Async
    public void receivedMessage(JsonNode msg) throws IOException, InterruptedException {
        try {
            String url = msg.get("extTabUrl").asText();
            String acc = msg.get("accNo").asText();
            JsonNode submission = null;
            HttpGet httpGet = new HttpGet(url);
            httpGet.setHeader(UserSecurityService.X_SESSION_TOKEN, securityConfig.getPartialUpdateRestSecurityToken());
            HttpClientBuilder clientBuilder = HttpClients.custom();
            if(securityConfig.getHttpProxyHost()!=null && !securityConfig.getHttpProxyHost().isEmpty()) {
                clientBuilder.setProxy(new HttpHost(securityConfig.getHttpProxyHost(), securityConfig.getGetHttpProxyPort()));
            }
            try (CloseableHttpResponse response = clientBuilder.build().execute(httpGet)) {
                submission = new ObjectMapper().readTree(EntityUtils.toString(response.getEntity()));
            } catch (Exception exception) {
                LOGGER.error("problem in sending http req to authentication server", exception);
                return;
            }
            if (submission != null && submission.has("log") && submission.get("log").has("message")
                    && submission.get("log").get("message").asText().endsWith("was not found")) {
                LOGGER.debug("Ignoring {}", acc);
                return;
            }
            indexService.indexOne(submission, true);
            LOGGER.debug("{} updated", acc);
        } catch (Exception ex) {
            LOGGER.error("Error parsing message {}", msg);
            Thread.sleep(10000);
            throw ex;
        }
    }

}
