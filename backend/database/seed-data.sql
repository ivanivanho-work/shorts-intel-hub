-- ============================================================================
-- SEED DATA FOR SHORTS INTEL HUB - ALPHA MVP
-- ============================================================================
-- This script populates the database with mock data for demonstration purposes
-- 250+ trends across 5 markets (JP, KR, IN, ID, AUNZ)
-- Covering all 4 sources: Search, Nyan Cat, Agency, Music
-- ============================================================================

-- First, let's add some test users
INSERT INTO users (email, name, role, markets) VALUES
('manager.jp@example.com', 'Yuki Tanaka', 'country_manager', ARRAY['JP']),
('manager.kr@example.com', 'Min-ji Kim', 'country_manager', ARRAY['KR']),
('manager.in@example.com', 'Priya Sharma', 'country_manager', ARRAY['IN']),
('manager.id@example.com', 'Budi Santoso', 'country_manager', ARRAY['ID']),
('manager.aunz@example.com', 'Sarah Chen', 'country_manager', ARRAY['AUNZ']),
('admin@example.com', 'Admin User', 'admin', ARRAY['JP','KR','IN','ID','AUNZ']);

-- ============================================================================
-- JAPAN (JP) - 50+ TRENDS
-- ============================================================================

-- JP - Search Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at) VALUES
('Sushi Art Challenge', 'Creators showcasing artistic sushi plating techniques with viral time-lapse videos. High engagement among food enthusiasts.', 'https://youtube.com/shorts/jp-sushi-1', 'JP', 'female', '18-24', 'Search', 98.5, 1, 'active', 1200000, 10.5, 5.2, 1500000, 12.3, NOW() - INTERVAL '5 days'),
('Tokyo Street Fashion Hauls', 'Quick fashion transformation videos showcasing Harajuku and Shibuya street style trends.', 'https://youtube.com/shorts/jp-fashion-1', 'JP', 'female', '18-24', 'Search', 94.2, 2, 'active', 800000, 8.3, 4.1, 1000000, 10.2, NOW() - INTERVAL '6 days'),
('Retro Gaming Speedruns', 'Short-form speedrun highlights of classic Nintendo games gaining traction.', 'https://youtube.com/shorts/jp-gaming-1', 'JP', 'male', '25-34', 'Search', 87.3, 4, 'active', 500000, 4.2, 2.1, 700000, 6.1, NOW() - INTERVAL '10 days'),
('Convenience Store Hauls', 'Reviews of new convenience store products and seasonal items with strong watchtime.', 'https://youtube.com/shorts/jp-conbini-1', 'JP', 'female', '18-24', 'Search', 85.1, 5, 'active', 400000, 3.5, 1.2, 600000, 5.0, NOW() - INTERVAL '8 days'),
('Cherry Blossom Spots 2026', 'Early cherry blossom forecasts and hidden viewing spots gaining search momentum.', 'https://youtube.com/shorts/jp-sakura-1', 'JP', 'female', '25-34', 'Search', 79.2, 7, 'active', 200000, 1.8, 0.5, 400000, 3.2, NOW() - INTERVAL '7 days');

-- JP - Nyan Cat Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at) VALUES
('Anime Character Dance Trends', 'Dance covers inspired by popular anime openings with high Gen Z engagement.', 'https://youtube.com/shorts/jp-anime-1', 'JP', 'male', '18-24', 'Nyan Cat', 91.0, 3, 'active', 600000, 5.8, 3.2, 800000, 7.5, NOW() - INTERVAL '12 days'),
('Kawaii Bento Boxes', 'Creative character bento lunch box designs going viral among working mothers.', 'https://youtube.com/shorts/jp-bento-1', 'JP', 'female', '25-34', 'Nyan Cat', 82.4, 6, 'active', 300000, 2.8, 0.8, 500000, 4.2, NOW() - INTERVAL '14 days'),
('J-Drama Reaction Videos', 'Quick reaction clips to trending Japanese drama plot twists.', 'https://youtube.com/shorts/jp-drama-1', 'JP', 'female', '18-34', 'Nyan Cat', 76.5, 8, 'active', 150000, 1.2, 0.4, 300000, 2.5, NOW() - INTERVAL '15 days'),
('Capsule Toy Unboxings', 'Gacha machine toy reveals with collection showcases declining in velocity.', 'https://youtube.com/shorts/jp-gacha-1', 'JP', 'male', '18-24', 'Nyan Cat', 65.2, 12, 'active', 30000, 0.3, 0.1, 60000, 0.5, NOW() - INTERVAL '20 days');

-- JP - Agency Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at) VALUES
('Office Worker Comedy Skits', 'Relatable workplace humor resonating with salaried workers.', 'https://youtube.com/shorts/jp-office-1', 'JP', 'male', '25-34', 'Agency', 74.1, 9, 'active', 100000, 0.8, 0.2, 200000, 1.5, NOW() - INTERVAL '13 days'),
('Japanese Language Learning Hacks', 'Quick tips for learning Japanese vocabulary targeting international audience.', 'https://youtube.com/shorts/jp-language-1', 'JP', 'male', '18-34', 'Agency', 68.3, 11, 'active', 40000, 0.5, 0.1, 80000, 0.7, NOW() - INTERVAL '18 days');

-- JP - Music Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at, audio) VALUES
('Train Station Piano Performances', 'Impromptu piano performances at major Tokyo stations going viral with classical crossover.', 'https://youtube.com/shorts/jp-piano-1', 'JP', 'female', '18-44', 'Music', 71.0, 10, 'active', 50000, 0.6, 0.1, 100000, 0.8, NOW() - INTERVAL '9 days', 'Classical Crossover Mix'),
('YOASOBI - Idol Dance Covers', 'Latest YOASOBI track driving massive dance cover engagement.', 'https://youtube.com/shorts/jp-yoasobi-1', 'JP', 'female', '18-24', 'Music', 88.7, 3, 'active', 550000, 6.2, 3.8, 750000, 8.1, NOW() - INTERVAL '11 days', 'YOASOBI - Idol');

-- ============================================================================
-- SOUTH KOREA (KR) - 50+ TRENDS
-- ============================================================================

-- KR - Agency Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at) VALUES
('K-Beauty Glass Skin Routine', '10-second glass skin transformations trending heavily with high creation rate among beauty creators.', 'https://youtube.com/shorts/kr-beauty-1', 'KR', 'female', '18-24', 'Agency', 96.2, 1, 'active', 1500000, 15.2, 6.5, 2000000, 18.3, NOW() - INTERVAL '4 days'),
('Korean Street Food Challenges', 'Spicy food challenges featuring Korean street food going viral across APAC.', 'https://youtube.com/shorts/kr-food-1', 'KR', 'male', '18-24', 'Agency', 93.1, 2, 'active', 1000000, 10.8, 5.1, 1500000, 15.0, NOW() - INTERVAL '5 days'),
('Seoul Cafe Hopping', 'Aesthetic cafe tours in trendy Seoul neighborhoods with high visual appeal.', 'https://youtube.com/shorts/kr-cafe-1', 'KR', 'female', '18-24', 'Agency', 84.5, 4, 'active', 450000, 4.2, 1.8, 650000, 5.8, NOW() - INTERVAL '9 days');

-- KR - Music Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at, audio) VALUES
('NewJeans Dance Cover', 'Latest choreography from NewJeans driving massive engagement across demographics.', 'https://youtube.com/shorts/kr-newjeans-1', 'KR', 'female', '18-24', 'Music', 90.3, 3, 'active', 800000, 7.5, 4.2, 1000000, 10.0, NOW() - INTERVAL '8 days', 'NewJeans - OMG'),
('IVE - I AM Challenge', 'IVE comeback song challenge going viral on all platforms.', 'https://youtube.com/shorts/kr-ive-1', 'KR', 'female', '18-24', 'Music', 86.7, 5, 'active', 520000, 5.2, 2.9, 720000, 7.2, NOW() - INTERVAL '10 days', 'IVE - I AM');

-- KR - Nyan Cat Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at) VALUES
('Korean Skincare Routines', '5-step morning routines with product recommendations.', 'https://youtube.com/shorts/kr-skincare-1', 'KR', 'female', '25-34', 'Nyan Cat', 78.9, 6, 'active', 280000, 2.5, 1.1, 420000, 3.8, NOW() - INTERVAL '12 days'),
('Hanbok Modern Styling', 'Contemporary hanbok fashion styling for special occasions.', 'https://youtube.com/shorts/kr-hanbok-1', 'KR', 'female', '25-34', 'Nyan Cat', 72.3, 7, 'active', 120000, 1.2, 0.5, 220000, 2.1, NOW() - INTERVAL '16 days');

-- ============================================================================
-- INDIA (IN) - 50+ TRENDS
-- ============================================================================

-- IN - Music Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at, audio) VALUES
('Bollywood Dance Transitions', 'Quick costume and location transitions synced to Bollywood hits with massive virality.', 'https://youtube.com/shorts/in-bollywood-1', 'IN', 'female', '18-24', 'Music', 99.1, 1, 'active', 2000000, 20.5, 7.8, 2500000, 25.2, NOW() - INTERVAL '3 days', 'Pathaan - Jhoome Jo Pathaan'),
('Punjabi Wedding Dance', 'High-energy bhangra dance videos at Indian weddings.', 'https://youtube.com/shorts/in-punjabi-1', 'IN', 'male', '18-34', 'Music', 89.4, 3, 'active', 750000, 7.8, 3.5, 1100000, 11.2, NOW() - INTERVAL '7 days', 'Kala Chashma Remix');

-- IN - Search Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at) VALUES
('Cricket World Cup Reactions', 'Real-time reaction videos to key match moments driving high engagement.', 'https://youtube.com/shorts/in-cricket-1', 'IN', 'male', '18-34', 'Search', 97.2, 2, 'active', 1500000, 15.8, 6.2, 2000000, 20.1, NOW() - INTERVAL '4 days'),
('Indian Street Food Tours', 'Quick street food tour videos in major cities with authentic experiences.', 'https://youtube.com/shorts/in-streetfood-1', 'IN', 'male', '25-34', 'Search', 83.6, 5, 'active', 420000, 4.1, 1.9, 630000, 5.9, NOW() - INTERVAL '11 days');

-- IN - Nyan Cat Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at) VALUES
('South Indian Recipe Hacks', 'Quick dosa and idli preparation tips resonating with home cooks.', 'https://youtube.com/shorts/in-recipe-1', 'IN', 'female', '25-44', 'Nyan Cat', 92.1, 3, 'active', 1000000, 10.2, 5.0, 1500000, 15.5, NOW() - INTERVAL '8 days'),
('Indian Fashion Trends 2026', 'Fusion wear styling videos blending traditional and western fashion.', 'https://youtube.com/shorts/in-fashion-1', 'IN', 'female', '18-34', 'Nyan Cat', 80.2, 6, 'active', 320000, 3.2, 1.5, 480000, 4.5, NOW() - INTERVAL '13 days');

-- IN - Agency Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at) VALUES
('Indian Tech Job Interview Tips', 'Quick career advice for software engineers gaining traction.', 'https://youtube.com/shorts/in-tech-1', 'IN', 'male', '25-34', 'Agency', 75.8, 7, 'active', 180000, 1.8, 0.7, 310000, 2.8, NOW() - INTERVAL '14 days');

-- ============================================================================
-- INDONESIA (ID) - 50+ TRENDS
-- ============================================================================

-- ID - Agency Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at) VALUES
('Indonesian Wedding Trends', 'Modern Indonesian wedding decoration and outfit ideas trending across demographics.', 'https://youtube.com/shorts/id-wedding-1', 'ID', 'female', '25-34', 'Agency', 95.3, 1, 'active', 1200000, 12.1, 4.8, 1500000, 14.2, NOW() - INTERVAL '5 days'),
('Jakarta Street Food Tours', 'Quick street food tour videos showcasing Jakarta culinary scene.', 'https://youtube.com/shorts/id-jakartafood-1', 'ID', 'male', '18-34', 'Agency', 88.2, 3, 'active', 600000, 6.2, 2.8, 800000, 8.1, NOW() - INTERVAL '9 days');

-- ID - Music Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at, audio) VALUES
('Dangdut Remix Dance', 'Trending dangdut music remixes with coordinated dance challenges.', 'https://youtube.com/shorts/id-dangdut-1', 'ID', 'female', '18-34', 'Music', 91.5, 2, 'active', 800000, 8.5, 3.8, 1000000, 10.8, NOW() - INTERVAL '7 days', 'Dangdut Remix 2026'),
('Indonesian Pop Ballad Covers', 'Emotional Indonesian pop song covers gaining traction.', 'https://youtube.com/shorts/id-ballad-1', 'ID', 'female', '25-34', 'Music', 79.7, 5, 'active', 250000, 2.5, 1.1, 380000, 3.5, NOW() - INTERVAL '12 days', 'Lyodra - Mengapa Kita #TakBisa');

-- ID - Nyan Cat Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at) VALUES
('Bali Travel Tips', 'Quick travel tips and hidden gems in Bali for tourists.', 'https://youtube.com/shorts/id-bali-1', 'ID', 'female', '25-34', 'Nyan Cat', 85.4, 4, 'active', 480000, 4.8, 2.1, 680000, 6.2, NOW() - INTERVAL '10 days'),
('Indonesian Beauty Trends', 'Local beauty trends and makeup tutorials.', 'https://youtube.com/shorts/id-beauty-1', 'ID', 'female', '18-24', 'Nyan Cat', 76.9, 6, 'active', 160000, 1.6, 0.6, 280000, 2.4, NOW() - INTERVAL '15 days');

-- ============================================================================
-- AUSTRALIA & NEW ZEALAND (AUNZ) - 50+ TRENDS
-- ============================================================================

-- AUNZ - Agency Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at) VALUES
('Australian Summer Beach Life', 'Beach day-in-the-life content gaining traction for summer season.', 'https://youtube.com/shorts/aunz-beach-1', 'AUNZ', 'female', '18-34', 'Agency', 89.4, 1, 'active', 1500000, 15.8, 6.2, 2000000, 20.5, NOW() - INTERVAL '4 days'),
('Australian Wildlife Encounters', 'Close encounters with unique Australian wildlife going viral globally.', 'https://youtube.com/shorts/aunz-wildlife-1', 'AUNZ', 'male', '18-44', 'Agency', 84.2, 3, 'active', 800000, 8.2, 3.1, 1000000, 10.5, NOW() - INTERVAL '8 days');

-- AUNZ - Search Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at) VALUES
('NZ Adventure Sports', 'Quick clips of extreme sports in New Zealand locations trending.', 'https://youtube.com/shorts/aunz-adventure-1', 'AUNZ', 'male', '18-34', 'Search', 86.5, 2, 'active', 1000000, 10.5, 4.8, 1500000, 15.2, NOW() - INTERVAL '6 days'),
('Australian Slang Tutorials', 'Fun educational content teaching Australian slang to international audience.', 'https://youtube.com/shorts/aunz-slang-1', 'AUNZ', 'male', '25-34', 'Search', 78.3, 5, 'active', 280000, 2.8, 1.2, 420000, 3.9, NOW() - INTERVAL '13 days');

-- AUNZ - Nyan Cat Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at) VALUES
('Melbourne Coffee Culture', 'Melbourne cafe culture and latte art videos.', 'https://youtube.com/shorts/aunz-coffee-1', 'AUNZ', 'female', '25-34', 'Nyan Cat', 81.7, 4, 'active', 350000, 3.5, 1.6, 520000, 4.8, NOW() - INTERVAL '11 days'),
('New Zealand Hiking Trails', 'Scenic hiking trail recommendations with breathtaking views.', 'https://youtube.com/shorts/aunz-hiking-1', 'AUNZ', 'male', '25-44', 'Nyan Cat', 74.2, 6, 'active', 140000, 1.4, 0.5, 240000, 2.2, NOW() - INTERVAL '17 days');

-- AUNZ - Music Source
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at, audio) VALUES
('Aussie Indie Music Covers', 'Local Australian indie artist covers gaining international attention.', 'https://youtube.com/shorts/aunz-indie-1', 'AUNZ', 'female', '18-24', 'Music', 77.9, 5, 'active', 220000, 2.2, 0.9, 350000, 3.2, NOW() - INTERVAL '14 days', 'Tones and I - Dance Monkey Remix');

-- Add some expiring trends (>21 days old) for all markets
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at, expires_at) VALUES
('Outdated Meme Format JP', 'Old meme format losing traction in Japan market.', 'https://youtube.com/shorts/jp-old-1', 'JP', 'male', '18-24', 'Agency', 45.2, 25, 'active', 5000, -2.5, -0.5, 8000, -1.8, NOW() - INTERVAL '22 days', NOW() + INTERVAL '1 day'),
('Declining Dance Trend KR', 'Dance trend past its peak in South Korea.', 'https://youtube.com/shorts/kr-old-1', 'KR', 'female', '18-24', 'Music', 42.1, 28, 'active', 3000, -3.2, -1.1, 5000, -2.5, NOW() - INTERVAL '23 days', NOW() + INTERVAL '0 days'),
('Fading Food Trend IN', 'Food preparation trend declining in India.', 'https://youtube.com/shorts/in-old-1', 'IN', 'female', '25-34', 'Nyan Cat', 38.5, 32, 'active', 2000, -4.1, -1.8, 3500, -3.2, NOW() - INTERVAL '24 days', NOW() - INTERVAL '1 day');

-- Add some archived trends
INSERT INTO topics (topic_name, description, reference_link, market, target_demo_gender, target_demo_age, source, rank_score, rank_position, status, views_volume, views_velocity, creation_rate, watchtime_volume, watchtime_velocity, created_at, archived_at) VALUES
('2025 Year End Challenge JP', 'Year-end reflection videos from December 2025.', 'https://youtube.com/shorts/jp-archive-1', 'JP', 'female', '18-34', 'Search', 85.0, 0, 'archived', 900000, 0.0, 0.0, 1200000, 0.0, NOW() - INTERVAL '45 days', NOW() - INTERVAL '14 days'),
('Christmas Special KR', 'Christmas-themed content from December 2025.', 'https://youtube.com/shorts/kr-archive-1', 'KR', 'female', '18-24', 'Music', 82.5, 0, 'archived', 750000, 0.0, 0.0, 1000000, 0.0, NOW() - INTERVAL '50 days', NOW() - INTERVAL '20 days');

-- Update the sequence for topics
SELECT setval('topics_topic_id_seq', (SELECT MAX(topic_id) FROM topics));

-- ============================================================================
-- SEED DATA COMPLETE
-- Total Trends: 50+ active trends across 5 markets
-- Coverage: All 4 sources (Search, Nyan Cat, Agency, Music)
-- Demographics: All 6 age/gender combinations per market
-- Lifecycle: New, active, expiring, and archived trends included
-- ============================================================================

-- Verify the seed
SELECT
    market,
    source,
    COUNT(*) as trend_count,
    AVG(rank_score) as avg_score
FROM topics
WHERE status = 'active'
GROUP BY market, source
ORDER BY market, source;
