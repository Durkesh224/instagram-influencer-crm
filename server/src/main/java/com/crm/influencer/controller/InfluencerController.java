package com.crm.influencer.controller;

import com.crm.influencer.model.Influencer;
import com.crm.influencer.repository.InfluencerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class InfluencerController {

    @Autowired
    private InfluencerRepository influencerRepository;

    @GetMapping("/influencers/check")
    public ResponseEntity<?> checkInfluencerByUsername(@RequestParam String username) {
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.ok(Map.of("exists", false));
        }
        String cleanUsername = username.trim().toLowerCase().replaceAll("^@", "");
        return influencerRepository.findByUsername(cleanUsername)
                .map(inf -> ResponseEntity.ok(Map.of("exists", true, "influencer", inf)))
                .orElse(ResponseEntity.ok(Map.of("exists", false)));
    }

    @PostMapping("/influencers")
    public ResponseEntity<?> createInfluencer(@RequestBody Influencer influencer) {
        if (influencer.getUsername() == null || influencer.getUsername().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
        }

        String cleanUsername = influencer.getUsername().trim().toLowerCase().replaceAll("^@", "");
        influencer.setUsername(cleanUsername);

        if (influencerRepository.existsByUsername(cleanUsername)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Influencer already exists"));
        }

        if (influencer.getName() == null || influencer.getName().trim().isEmpty()) influencer.setName("N/A");
        if (influencer.getBio() == null) influencer.setBio("N/A");
        if (influencer.getFollowers() == null) influencer.setFollowers("N/A");
        if (influencer.getFollowing() == null) influencer.setFollowing("N/A");
        if (influencer.getPosts() == null) influencer.setPosts("N/A");
        if (influencer.getProfileImage() == null) influencer.setProfileImage("N/A");
        if (influencer.getWebsiteUrl() == null) influencer.setWebsiteUrl("N/A");
        if (influencer.getLocation() == null) influencer.setLocation("N/A");
        if (influencer.getCategory() == null || influencer.getCategory().trim().isEmpty()) {
            influencer.setCategory(detectCategoryFromBio(influencer.getBio(), influencer.getName()));
        }
        if (influencer.getProfileUrl() == null || influencer.getProfileUrl().trim().isEmpty()) {
            influencer.setProfileUrl("https://www.instagram.com/" + cleanUsername + "/");
        }

        Influencer saved = influencerRepository.save(influencer);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/influencers")
    public List<Influencer> getAllInfluencers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "newest") String sort) {

        List<Influencer> list;
        if (search != null && !search.trim().isEmpty()) {
            list = influencerRepository.searchInfluencers(search.trim());
        } else {
            list = influencerRepository.findAll();
        }

        for (Influencer inf : list) {
            if (inf.getCategory() == null || inf.getCategory().trim().isEmpty() || "N/A".equalsIgnoreCase(inf.getCategory())) {
                inf.setCategory(detectCategoryFromBio(inf.getBio(), inf.getName()));
            }
        }

        if ("oldest".equalsIgnoreCase(sort)) {
            list.sort(Comparator.comparing(Influencer::getId));
        } else if ("followers".equalsIgnoreCase(sort)) {
            list.sort((a, b) -> Long.compare(parseFollowerCount(b.getFollowers()), parseFollowerCount(a.getFollowers())));
        } else {
            // Default: newest
            list.sort((a, b) -> b.getId().compareTo(a.getId()));
        }

        return list;
    }

    @GetMapping("/influencers/{id}")
    public ResponseEntity<?> getInfluencerById(@PathVariable Long id) {
        return influencerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/influencers/{id}")
    public ResponseEntity<?> updateInfluencer(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        return influencerRepository.findById(id).map(influencer -> {
            if (updates.containsKey("isFavorite") || updates.containsKey("favorite") || updates.containsKey("is_favorite")) {
                Object val = updates.containsKey("isFavorite") ? updates.get("isFavorite") :
                             updates.containsKey("favorite") ? updates.get("favorite") : updates.get("is_favorite");
                boolean fav = false;
                if (val instanceof Boolean) {
                    fav = (Boolean) val;
                } else if (val != null) {
                    fav = Boolean.parseBoolean(val.toString().trim());
                }
                influencer.setIsFavorite(fav);
            }
            if (updates.containsKey("tag")) influencer.setTag(String.valueOf(updates.get("tag")));
            if (updates.containsKey("notes")) influencer.setNotes(String.valueOf(updates.get("notes")));
            if (updates.containsKey("name")) influencer.setName(String.valueOf(updates.get("name")));
            if (updates.containsKey("bio")) influencer.setBio(String.valueOf(updates.get("bio")));
            if (updates.containsKey("category")) influencer.setCategory(String.valueOf(updates.get("category")));
            if (updates.containsKey("location")) influencer.setLocation(String.valueOf(updates.get("location")));
            if (updates.containsKey("websiteUrl")) influencer.setWebsiteUrl(String.valueOf(updates.get("websiteUrl")));
            
            Influencer updated = influencerRepository.save(influencer);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    private String detectCategoryFromBio(String bio, String name) {
        String combined = (bio + " " + name).toLowerCase();
        if (combined.matches(".*\\b(fit|fitness|gym|workout|trainer|coach|crossfit|health|bodybuilding|wellness)\\b.*")) return "Fitness & Health";
        if (combined.matches(".*\\b(sport|sports|athlete|football|basketball|soccer|cricket|tennis|golf|runner|swimmer)\\b.*")) return "Sports & Athletes";
        if (combined.matches(".*\\b(fashion|style|outfit|model|clothing|wear|apparel|stylist)\\b.*")) return "Fashion & Style";
        if (combined.matches(".*\\b(beauty|makeup|skincare|cosmetics|hair|aesthetic|mua)\\b.*")) return "Beauty & Cosmetics";
        if (combined.matches(".*\\b(business|tech|founder|ceo|entrepreneur|investor|marketing|crypto|software|developer|startup)\\b.*")) return "Business & Tech";
        if (combined.matches(".*\\b(travel|explore|photographer|photography|adventure|wanderlust|vlog|vlogger|lifestyle)\\b.*")) return "Travel & Lifestyle";
        return "Digital Creator";
    }

    @DeleteMapping("/influencers/{id}")
    public ResponseEntity<?> deleteInfluencer(@PathVariable Long id) {
        if (!influencerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        influencerRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Influencer deleted successfully"));
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        List<Influencer> influencers = influencerRepository.findAll();
        long totalInfluencers = influencers.size();

        long totalFollowersNum = influencers.stream()
                .mapToLong(i -> parseFollowerCount(i.getFollowers()))
                .sum();

        String totalFollowersFormatted = formatCount(totalFollowersNum);

        long favoritesCount = influencers.stream().filter(i -> Boolean.TRUE.equals(i.getIsFavorite())).count();

        long recentlyAdded = influencers.stream()
                .filter(i -> i.getCreatedAt() != null && i.getCreatedAt().isAfter(java.time.LocalDateTime.now().minusDays(1)))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalInfluencers", totalInfluencers);
        stats.put("totalFollowers", totalFollowersFormatted);
        stats.put("totalFollowersRaw", totalFollowersNum);
        stats.put("favoritesCount", favoritesCount);
        stats.put("recentlyAdded", recentlyAdded > 0 ? recentlyAdded : totalInfluencers);

        return stats;
    }

    private long parseFollowerCount(String countStr) {
        if (countStr == null || countStr.equalsIgnoreCase("N/A") || countStr.trim().isEmpty()) {
            return 0L;
        }
        try {
            String clean = countStr.trim().toUpperCase().replaceAll(",", "").replaceAll(" ", "");
            double multiplier = 1.0;
            if (clean.endsWith("K")) {
                multiplier = 1_000.0;
                clean = clean.substring(0, clean.length() - 1);
            } else if (clean.endsWith("M")) {
                multiplier = 1_000_000.0;
                clean = clean.substring(0, clean.length() - 1);
            } else if (clean.endsWith("B")) {
                multiplier = 1_000_000_000.0;
                clean = clean.substring(0, clean.length() - 1);
            }
            return (long) (Double.parseDouble(clean) * multiplier);
        } catch (Exception e) {
            return 0L;
        }
    }

    private String formatCount(long count) {
        if (count >= 1_000_000_000) {
            return String.format(Locale.US, "%.1fB", count / 1_000_000_000.0);
        } else if (count >= 1_000_000) {
            return String.format(Locale.US, "%.1fM", count / 1_000_000.0);
        } else if (count >= 1_000) {
            return String.format(Locale.US, "%.1fK", count / 1_000.0);
        }
        return String.valueOf(count);
    }
}
