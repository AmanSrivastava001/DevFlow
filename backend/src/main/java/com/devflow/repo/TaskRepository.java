package com.devflow.repo;
import com.devflow.model.WorkTask;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface TaskRepository extends JpaRepository<WorkTask, Long> {
    List<WorkTask> findByProjectOwnerIdOrderByCreatedAtDesc(Long ownerId);
    List<WorkTask> findByProjectIdAndProjectOwnerIdOrderByCreatedAtDesc(Long projectId, Long ownerId);
    Optional<WorkTask> findByIdAndProjectOwnerId(Long id, Long ownerId);
    void deleteByProjectIdAndProjectOwnerId(Long projectId, Long ownerId);
}
