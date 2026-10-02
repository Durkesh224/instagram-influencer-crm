package com.crm.influencer.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "influencers", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"username"})
})
public class Influencer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(nullable = false, unique = true)
    private String username;

    private String profileUrl;

    @Column(length = 2000)
    private String bio;

    private String followers;
    private String following;
    private String posts;

    @Column(length = 1000)
    private String profileImage;

    @Column(length = 1000)
    private String websiteUrl;

    @Column(length = 500)
    private String location;

    @Column(length = 500)
    private String category;

    private String tag = "Potential";

    @Column(length = 2000)
    private String notes = "";

    @JsonProperty("isFavorite")
    @Column(name = "is_favorite")
    private Boolean isFavorite = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Influencer() {}

    public Influencer(String name, String username, String profileUrl, String bio, String followers, String following, String posts, String profileImage, String websiteUrl, String location, String category, String tag, String notes, Boolean isFavorite) {
        this.name = name;
        this.username = username;
        this.profileUrl = profileUrl;
        this.bio = bio;
        this.followers = followers;
        this.following = following;
        this.posts = posts;
        this.profileImage = profileImage;
        this.websiteUrl = websiteUrl;
        this.location = location;
        this.category = category;
        if (tag != null && !tag.trim().isEmpty()) this.tag = tag;
        if (notes != null) this.notes = notes;
        this.isFavorite = isFavorite != null ? isFavorite : false;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getProfileUrl() { return profileUrl; }
    public void setProfileUrl(String profileUrl) { this.profileUrl = profileUrl; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getFollowers() { return followers; }
    public void setFollowers(String followers) { this.followers = followers; }

    public String getFollowing() { return following; }
    public void setFollowing(String following) { this.following = following; }

    public String getPosts() { return posts; }
    public void setPosts(String posts) { this.posts = posts; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    public String getWebsiteUrl() { return websiteUrl; }
    public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    @JsonProperty("isFavorite")
    public Boolean getIsFavorite() { return isFavorite != null ? isFavorite : false; }
    
    public void setIsFavorite(Boolean favorite) { this.isFavorite = favorite != null ? favorite : false; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
