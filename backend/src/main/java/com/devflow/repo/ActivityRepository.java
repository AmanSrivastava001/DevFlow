package com.devflow.repo;
import com.devflow.model.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ActivityRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findTop12ByOwnerIdOrderByCreatedAtDesc(Long ownerId);
}
