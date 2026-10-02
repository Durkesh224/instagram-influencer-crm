package com.crm.influencer.repository;

import com.crm.influencer.model.Influencer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InfluencerRepository extends JpaRepository<Influencer, Long> {
    Optional<Influencer> findByUsername(String username);
    boolean existsByUsername(String username);

    @Query("SELECT i FROM Influencer i WHERE LOWER(i.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(i.username) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(i.category) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(i.location) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Influencer> searchInfluencers(@Param("query") String query);
}
