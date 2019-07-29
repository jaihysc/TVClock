package tvclockserver.docs;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.docs.v1.Docs;
import com.google.api.services.docs.v1.DocsScopes;
import com.google.api.services.docs.v1.model.Document;
import com.google.api.services.docs.v1.model.StructuralElement;
import tvclockserver.storage.ApplicationData;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Collections;
import java.util.List;

public class DocsFacade {
    private static final String ApplicationName = "TVClock - Java";
    private static final JsonFactory JsonFactory = JacksonFactory.getDefaultInstance();
    private static final String TokensDirectory = "tokens";

    private static final List<String> Scopes = Collections.singletonList(DocsScopes.DOCUMENTS_READONLY);

    /**
     * Creates an authorized Credential object.
     * @param HTTP_TRANSPORT The network HTTP Transport.
     * @return An authorized Credential object.
     * @throws IOException If the credentials.json file cannot be found.
     */
    private static Credential getCredentials(final NetHttpTransport HTTP_TRANSPORT) throws IOException {
        // Load client secrets
        InputStream in = DocsFacade.class.getResourceAsStream("/tvclockserver/credentials.json");

        if (in == null) {
            System.out.println("DocsFacade | Credentials Resource not found");
            return null;
        }

        GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(JsonFactory, new InputStreamReader(in));

        // Build flow and trigger user authorization request
        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                HTTP_TRANSPORT, JsonFactory, clientSecrets, Scopes)
                .setDataStoreFactory(new FileDataStoreFactory(new java.io.File(TokensDirectory)))
                .setAccessType("offline")
                .build();
        LocalServerReceiver receiver = new LocalServerReceiver.Builder().setPort(8888).build();
        return new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");
    }

    public static String fetchDoc() {
        // Build a new authorized API client service
        try {
            final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
            Docs service = new Docs.Builder(HTTP_TRANSPORT, JsonFactory, getCredentials(HTTP_TRANSPORT))
                    .setApplicationName(ApplicationName)
                    .build();

            Document response = service.documents().get(ApplicationData.googleDocsDocumentId).execute();

            List<StructuralElement> content = response.getBody().getContent();
            StringBuilder text = new StringBuilder();

            // Iterate through the response to extract the text
            for (var structuralElement : content) {
                if (structuralElement.getParagraph() == null) continue;
                for (var element : structuralElement.getParagraph().getElements()) {
                    if (element.getTextRun() == null || element.getTextRun().getContent() == null) continue;
                    text.append(element.getTextRun().getContent());
                }
            }
            return text.toString();

        } catch (Exception e) {
            System.out.println("DocsFacade | Error fetching document at id: " + ApplicationData.googleDocsDocumentId);
            return "";
        }
    }
}