package com.devflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:devflow_integration;DB_CLOSE_DELAY=-1", "spring.jpa.hibernate.ddl-auto=create-drop"})
@AutoConfigureMockMvc
class ApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    private JsonNode register(String name) throws Exception {
        String email = name + "-" + UUID.randomUUID() + "@example.com";
        String body = mapper.writeValueAsString(java.util.Map.of("fullName", name, "email", email, "password", "StrongPassword987!"));
        String json = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return mapper.readTree(json);
    }

    @Test void newAccountsReceiveStarterWorkspaceAndCanMoveTasks() throws Exception {
        String token = register("TestUser").get("token").asText();
        String projects = mvc.perform(get("/api/projects").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(mapper.readTree(projects).size()).isEqualTo(3);

        String taskJson = mvc.perform(get("/api/tasks").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode taskList = mapper.readTree(taskJson);
        assertThat(taskList.size()).isEqualTo(9);
        // Lazy project associations must resolve via getters, not raw proxy fields.
        for (JsonNode task : taskList) {
            assertThat(task.path("projectId").isNumber()).isTrue();
            assertThat(task.path("projectName").asText()).isNotBlank();
        }
        long taskId = taskList.get(0).get("id").asLong();
        mvc.perform(patch("/api/tasks/" + taskId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"DONE\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DONE"));
        // Moving a task writes an ActivityLog with a non-null owner.
        mvc.perform(get("/api/dashboard").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activity[0].action").value("TASK_MOVED"));
        // Task deletion also reads the project's lazy owner association.
        mvc.perform(delete("/api/tasks/" + taskId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test void projectsAreNotAccessibleAcrossAccounts() throws Exception {
        String first = register("Alice").get("token").asText();
        String second = register("Bob").get("token").asText();
        JsonNode myProjects = mapper.readTree(mvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + first))
                .andReturn().getResponse().getContentAsString());
        long otherProjectId = myProjects.get(0).get("id").asLong();

        mvc.perform(get("/api/tasks").param("projectId", String.valueOf(otherProjectId))
                        .header("Authorization", "Bearer " + second))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/projects/" + otherProjectId)
                        .header("Authorization", "Bearer " + second))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/projects")).andExpect(status().isUnauthorized());
    }
}
