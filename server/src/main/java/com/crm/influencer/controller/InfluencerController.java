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
            Optional<Influencer> existingOpt = influencerRepository.findByUsername(cleanUsername);
            if (existingOpt.isPresent()) {
                Influencer existing = existingOpt.get();
                // Update non-empty extracted profile fields if re-captured
                if (influencer.getName() != null && !"N/A".equals(influencer.getName())) existing.setName(influencer.getName());
                if (influencer.getBio() != null && !"N/A".equals(influencer.getBio())) existing.setBio(influencer.getBio());
                if (influencer.getFollowers() != null && !"N/A".equals(influencer.getFollowers())) existing.setFollowers(influencer.getFollowers());
                if (influencer.getFollowing() != null && !"N/A".equals(influencer.getFollowing())) existing.setFollowing(influencer.getFollowing());
                if (influencer.getPosts() != null && !"N/A".equals(influencer.getPosts())) existing.setPosts(influencer.getPosts());
                if (influencer.getProfileImage() != null && !"N/A".equals(influencer.getProfileImage())) existing.setProfileImage(influencer.getProfileImage());
                if (influencer.getWebsiteUrl() != null && !"N/A".equals(influencer.getWebsiteUrl())) existing.setWebsiteUrl(influencer.getWebsiteUrl());
                if (influencer.getLocation() != null && !"N/A".equals(influencer.getLocation())) existing.setLocation(influencer.getLocation());
                if (influencer.getCategory() != null && !"N/A".equals(influencer.getCategory())) existing.setCategory(influencer.getCategory());
                existing.setUpdatedAt(java.time.LocalDateTime.now());
                Influencer updated = influencerRepository.save(existing);
                return ResponseEntity.ok(Map.of("message", "Influencer profile updated successfully", "influencer", updated, "updated", true));
            }
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
        influencer.setCreatedAt(java.time.LocalDateTime.now());
        influencer.setUpdatedAt(java.time.LocalDateTime.now());

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
        } else if ("name_asc".equalsIgnoreCase(sort)) {
            list.sort(Comparator.comparing(i -> i.getName() != null ? i.getName().toLowerCase() : ""));
        } else if ("name_desc".equalsIgnoreCase(sort)) {
            list.sort((a, b) -> (b.getName() != null ? b.getName().toLowerCase() : "").compareTo(a.getName() != null ? a.getName().toLowerCase() : ""));
        } else if ("followers_asc".equalsIgnoreCase(sort)) {
            list.sort(Comparator.comparingLong(a -> parseFollowerCount(a.getFollowers())));
        } else if ("favorites_first".equalsIgnoreCase(sort)) {
            list.sort((a, b) -> Boolean.compare(Boolean.TRUE.equals(b.getIsFavorite()), Boolean.TRUE.equals(a.getIsFavorite())));
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
            if (updates.containsKey("followers")) influencer.setFollowers(String.valueOf(updates.get("followers")));
            if (updates.containsKey("following")) influencer.setFollowing(String.valueOf(updates.get("following")));
            if (updates.containsKey("posts")) influencer.setPosts(String.valueOf(updates.get("posts")));
            
            influencer.setUpdatedAt(java.time.LocalDateTime.now());
            Influencer updated = influencerRepository.save(influencer);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    private String detectCategoryFromBio(String bio, String name) {
        String combined = ((bio != null ? bio : "") + " " + (name != null ? name : "")).toLowerCase();
        if (combined.matches(".*\\b(sport|sports|athlete|athletes|player|captain|cricket|cricketer|football|footballer|basketball|soccer|tennis|golf|runner|swimmer|racing|wwe|f1|olympian|badminton|hockey|boxer|wrestler|baller|striker|midfielder|bowler|batsman|allrounder|trophy|champion|champions|stadium|match|cristiano|ronaldo|virat|kohli|messi|leomessi|neymar|mbappe|lebron|kingjames|rohit|dhoni|sachin|hardik|bumrah|klrahul|siuu|siuuuu|rcb|bcci|one8|wrogn|realmadrid|alnassr|juventus|barcelona|psg|fifa|icc|ipl)\\b.*")) return "Sports & Athletes";
        if (combined.matches(".*\\b(fit|fitness|gym|workout|trainer|coach|crossfit|health|bodybuilding|wellness|physique|exercise|nutrition)\\b.*")) return "Fitness & Health";
        if (combined.matches(".*\\b(fashion|style|outfit|model|modeling|clothing|wear|apparel|stylist|vogue|couture|wardrobe)\\b.*")) return "Fashion & Style";
        if (combined.matches(".*\\b(beauty|makeup|skincare|cosmetics|hair|hairstylist|aesthetic|mua|skin|glow|salon)\\b.*")) return "Beauty & Cosmetics";
        if (combined.matches(".*\\b(business|tech|technology|founder|ceo|co-founder|entrepreneur|investor|marketing|crypto|software|developer|startup|agency|corporate)\\b.*")) return "Business & Tech";
        if (combined.matches(".*\\b(travel|explore|photographer|photography|adventure|wanderlust|vlog|vlogger|lifestyle|food|foodie|chef|hotel|traveler)\\b.*")) return "Travel & Lifestyle";
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
