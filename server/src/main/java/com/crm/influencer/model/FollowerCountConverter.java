package com.crm.influencer.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class FollowerCountConverter implements AttributeConverter<Long, String> {

    @Override
    public String convertToDatabaseColumn(Long attribute) {
        if (attribute == null) {
            return "0";
        }
        return String.valueOf(attribute);
    }

    @Override
    public Long convertToEntityAttribute(String dbData) {
        return parseFollowerCount(dbData);
    }

    public static long parseFollowerCount(Object val) {
        if (val == null) {
            return 0L;
        }
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        String str = String.valueOf(val).trim();
        if (str.isEmpty() || str.equalsIgnoreCase("N/A") || str.equals("—")) {
            return 0L;
        }

        // Match numeric part with optional decimal and suffix (k, m, b)
        // e.g. "679M", "679M s", "1.2M followers", "12,500", "2.4M", "1,234"
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("([0-9]+(?:[.,][0-9]+)?)\\s*([kmbKMB])?").matcher(str);
        if (!m.find()) {
            return 0L;
        }

        try {
            String numPart = m.group(1).replace(",", "");
            String suffix = m.group(2) != null ? m.group(2).toUpperCase() : "";
            double num = Double.parseDouble(numPart);
            if ("K".equals(suffix)) {
                num *= 1_000.0;
            } else if ("M".equals(suffix)) {
                num *= 1_000_000.0;
            } else if ("B".equals(suffix)) {
                num *= 1_000_000_000.0;
            }
            return Math.round(num);
        } catch (Exception e) {
            return 0L;
        }
    }
}
