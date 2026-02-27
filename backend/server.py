from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Upload directory & static files
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Import and include route modules
from routes.auth import router as auth_router
from routes.public import router as public_router
from routes.admin_content import router as admin_content_router
from routes.admin_tools import router as admin_tools_router
from routes.payments import router as payments_router

api_router.include_router(auth_router)
api_router.include_router(public_router)
api_router.include_router(admin_content_router)
api_router.include_router(admin_tools_router)
api_router.include_router(payments_router)

# Import shared config for seed data
from models.database import db, hash_password, ADMIN_EMAIL, ADMIN_PASSWORD

async def seed_data():
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing:
        settings = await db.settings.find_one({}, {"_id": 0})
        if settings and "social_links" not in settings:
            await db.settings.update_one({}, {"$set": {
                "social_links": [
                    {"id": str(uuid.uuid4()), "platform": "Facebook", "url": "https://facebook.com", "icon": "facebook"},
                    {"id": str(uuid.uuid4()), "platform": "Twitter", "url": "https://twitter.com", "icon": "twitter"},
                    {"id": str(uuid.uuid4()), "platform": "Instagram", "url": "https://instagram.com", "icon": "instagram"},
                    {"id": str(uuid.uuid4()), "platform": "LinkedIn", "url": "https://linkedin.com", "icon": "linkedin"},
                ],
                "blog_api_url": "https://carlosartiles.com/api.php",
                "colors": {
                    "primary": "#1a2332", "accent": "#0D9488",
                    "button_bg": "#1a2332", "button_text": "#FFFFFF",
                    "link_color": "#0D9488", "tab_active_bg": "#1a2332",
                    "tab_active_text": "#FFFFFF", "tab_inactive_bg": "#FFFFFF",
                    "tab_inactive_text": "#64748B", "icon_color": "#0D9488",
                    "heading_color": "#1a2332", "body_text": "#475569",
                    "footer_bg": "#1a2332", "footer_text": "#FFFFFF"
                },
                "email_from": "", "name_from": "", "email_to": "",
                "name_to": "", "email_cc": "",
            }})
        settings_check = await db.settings.find_one({}, {"_id": 0})
        if settings_check and "section_order" not in settings_check:
            await db.settings.update_one({}, {"$set": {"section_order": ["hero", "about", "services", "news", "blog", "reading_list", "map", "portfolio", "gallery", "testimonials", "contact"]}})
        nav_pages_count = await db.nav_pages.count_documents({})
        if nav_pages_count == 0:
            await db.nav_pages.insert_many([
                {"id": str(uuid.uuid4()), "title": "Terms of Service", "url": "/terms", "show_in_header": False, "show_in_footer": True, "open_in_new_tab": False, "login_required": False, "order": 1, "banner_image": "", "summary": "Our terms and conditions", "content": "", "page_type": "terms", "created_at": datetime.now(timezone.utc).isoformat()},
                {"id": str(uuid.uuid4()), "title": "Privacy Policy", "url": "/privacy", "show_in_header": False, "show_in_footer": True, "open_in_new_tab": False, "login_required": False, "order": 2, "banner_image": "", "summary": "Our privacy policy", "content": "", "page_type": "privacy", "created_at": datetime.now(timezone.utc).isoformat()},
            ])
        book_migration_data = {
            "Good to Great": {"synopsis": "A landmark study revealing what it takes to transform a good company into one that produces sustained great results.", "who_is_it_for": "Business leaders, managers, and entrepreneurs seeking to understand what separates great companies from good ones.", "about_author": "Jim Collins is a student and teacher of what makes great companies tick, and a Socratic advisor to leaders in the business and social sectors."},
            "The Lean Startup": {"synopsis": "Eric Ries presents a scientific approach to creating and managing successful startups in an age when companies need to innovate more than ever.", "who_is_it_for": "Startup founders, product managers, and anyone building something new under conditions of extreme uncertainty.", "about_author": "Eric Ries is an entrepreneur and author. He is the creator of the Lean Startup methodology."},
            "Thinking, Fast and Slow": {"synopsis": "Nobel laureate Daniel Kahneman takes us on a tour of the mind explaining the two systems that drive the way we think and how they shape our decisions.", "who_is_it_for": "Decision-makers, psychologists, economists, and anyone curious about how the mind works.", "about_author": "Daniel Kahneman is a psychologist and economist notable for his work on the psychology of judgment and decision-making."},
        }
        for title, fields in book_migration_data.items():
            book = await db.books.find_one({"title": title, "synopsis": {"$exists": False}})
            if book:
                await db.books.update_one({"title": title}, {"$set": fields})
        sample_user = await db.users.find_one({"email": "user@example.com"})
        if not sample_user:
            await db.users.insert_one({
                "user_id": f"user_{uuid.uuid4().hex[:12]}", "email": "user@example.com",
                "name": "John Doe", "first_name": "John", "last_name": "Doe",
                "password_hash": hash_password("User123!"), "role": "user",
                "picture": "", "phone": "+1 555-0100",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        return
    logger.info("Seeding initial data...")
    admin_id = f"user_{uuid.uuid4().hex[:12]}"
    await db.users.insert_one({
        "user_id": admin_id, "email": ADMIN_EMAIL, "name": "Admin",
        "first_name": "Admin", "last_name": "",
        "password_hash": hash_password(ADMIN_PASSWORD),
        "role": "admin", "picture": "", "phone": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.settings.insert_one({
        "id": "main", "brand_name": "Legacy", "tagline": "Strategic Business Consulting",
        "logo_url": "", "favicon_url": "",
        "meta_title": "Legacy - Strategic Business Consulting",
        "meta_description": "Innovative solutions tailored for your success",
        "primary_color": "#1a2332", "accent_color": "#0D9488",
        "smtp_host": "", "smtp_port": 587, "smtp_user": "", "smtp_password": "",
        "email_from": "", "name_from": "", "email_to": "", "name_to": "", "email_cc": "",
        "admin_email": ADMIN_EMAIL,
        "blog_api_url": "https://carlosartiles.com/api.php",
        "social_links": [
            {"id": str(uuid.uuid4()), "platform": "Facebook", "url": "https://facebook.com", "icon": "facebook"},
            {"id": str(uuid.uuid4()), "platform": "Twitter", "url": "https://twitter.com", "icon": "twitter"},
            {"id": str(uuid.uuid4()), "platform": "Instagram", "url": "https://instagram.com", "icon": "instagram"},
            {"id": str(uuid.uuid4()), "platform": "LinkedIn", "url": "https://linkedin.com", "icon": "linkedin"},
        ],
        "colors": {
            "primary": "#1a2332", "accent": "#0D9488",
            "button_bg": "#1a2332", "button_text": "#FFFFFF",
            "link_color": "#0D9488", "tab_active_bg": "#1a2332",
            "tab_active_text": "#FFFFFF", "tab_inactive_bg": "#FFFFFF",
            "tab_inactive_text": "#64748B", "icon_color": "#0D9488",
            "heading_color": "#1a2332", "body_text": "#475569",
            "footer_bg": "#1a2332", "footer_text": "#FFFFFF"
        },
        "sections": {
            "hero": {"enabled": True, "title": "Hero"},
            "about": {"enabled": True, "title": "About Us"},
            "services": {"enabled": True, "title": "Services"},
            "news": {"enabled": True, "title": "News"},
            "blog": {"enabled": True, "title": "Blog"},
            "reading_list": {"enabled": True, "title": "Reading List"},
            "map": {"enabled": True, "title": "Travel Map"},
            "portfolio": {"enabled": True, "title": "Portfolio"},
            "gallery": {"enabled": True, "title": "Gallery"},
            "testimonials": {"enabled": True, "title": "Testimonials"},
            "contact": {"enabled": True, "title": "Contact"}
        },
        "section_order": ["hero", "about", "services", "news", "blog", "reading_list", "map", "portfolio", "gallery", "testimonials", "contact"],
        "page_access": {
            "news": "public", "reading_list": "public", "gallery": "public",
            "map": "public", "terms": "public", "privacy": "public"
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.hero.insert_one({
        "id": "main", "subtitle": "WELCOME TO LEGACY CONSULTING",
        "title": "Innovative Solutions\nTailored for Your Success",
        "description": "We deliver strategic insights and personalized solutions to help businesses thrive in competitive markets. Our expert consultants guide you every step of the way.",
        "button_text": "Get Started", "button_link": "#contact",
        "background_image": "https://images.unsplash.com/photo-1650784854430-3ab0c30afdf3?crop=entropy&cs=srgb&fm=jpg&q=85",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.about.insert_one({
        "id": "main", "label": "ABOUT LEGACY",
        "title": "Smart and effective business agency.",
        "description": "We believe in the power of collaboration and personalized solutions. By understanding our clients' unique needs and goals, we tailor our approach to deliver strategic insights and creative solutions that drive lasting results.",
        "phone": "+1 (555) 123-4567", "signature_name": "Jonathan Pierce",
        "signature_title": "Founder & CEO",
        "image": "https://images.pexels.com/photos/7433919/pexels-photo-7433919.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "stats": [{"label": "Business Progress", "value": "90%"}],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.services.insert_many([
        {"id": str(uuid.uuid4()), "title": "Business Strategy", "description": "Smart, scalable business solutions tailored to help companies streamline operations.", "icon": "briefcase", "price": 299.00, "currency": "usd", "type": "service", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Growth Consulting", "description": "We identify untapped markets and customer segments to drive business growth.", "icon": "trending-up", "price": 499.00, "currency": "usd", "type": "service", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Financial Planning", "description": "Tailored financial planning to help businesses manage budgets and reduce risk.", "icon": "bar-chart-3", "price": 399.00, "currency": "usd", "type": "service", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Digital Transformation", "description": "Comprehensive digital strategy to modernize your business operations.", "icon": "monitor", "price": 599.00, "currency": "usd", "type": "product", "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    await db.blog_posts.insert_many([
        {"id": str(uuid.uuid4()), "title": "The Future of Business Consulting", "slug": "future-of-business-consulting", "summary": "Discover how modern consulting firms are adapting to digital transformation and AI-driven strategies.", "content": "<h2>The Evolution of Consulting</h2><p>The consulting industry is undergoing a fundamental shift driven by AI and data analytics.</p>", "category": "Business", "author": "Jonathan Pierce", "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800", "published": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "5 Strategies for Market Expansion", "slug": "5-strategies-market-expansion", "summary": "Learn proven approaches to expand your market reach and capture new customer segments.", "content": "<h2>Expanding Your Market</h2><p>Market expansion is critical for sustainable growth.</p>", "category": "Marketing", "author": "Sarah Mitchell", "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800", "published": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Building Resilient Organizations", "slug": "building-resilient-organizations", "summary": "Explore the key principles behind organizational resilience.", "content": "<h2>Organizational Resilience</h2><p>Resilience is a critical competitive advantage.</p>", "category": "Leadership", "author": "Michael Chen", "image": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800", "published": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    await db.books.insert_many([
        {"id": str(uuid.uuid4()), "title": "Good to Great", "author": "Jim Collins", "description": "Why some companies make the leap and others don't.", "synopsis": "A landmark study revealing what it takes to transform a good company into one that produces sustained great results.", "who_is_it_for": "Business leaders, managers, and entrepreneurs.", "about_author": "Jim Collins is a student and teacher of what makes great companies tick.", "image": "https://images.unsplash.com/photo-1543320996-542b8a0e022c?crop=entropy&cs=srgb&fm=jpg&q=85", "amazon_link": "https://amazon.com", "other_links": [{"name": "Barnes & Noble", "url": "https://barnesandnoble.com"}], "featured": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "The Lean Startup", "author": "Eric Ries", "description": "A revolutionary approach to business.", "synopsis": "Eric Ries presents a scientific approach to creating and managing successful startups.", "who_is_it_for": "Startup founders and product managers.", "about_author": "Eric Ries is an entrepreneur and creator of the Lean Startup methodology.", "image": "https://images.unsplash.com/photo-1695634621295-8f83685a35bb?crop=entropy&cs=srgb&fm=jpg&q=85", "amazon_link": "https://amazon.com", "other_links": [], "featured": False, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Thinking, Fast and Slow", "author": "Daniel Kahneman", "description": "A groundbreaking tour of the mind.", "synopsis": "Nobel laureate Daniel Kahneman explains the two systems that drive the way we think.", "who_is_it_for": "Decision-makers and anyone curious about how the mind works.", "about_author": "Daniel Kahneman is a psychologist notable for his work on judgment and decision-making.", "image": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800", "amazon_link": "https://amazon.com", "other_links": [], "featured": False, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    map_id = str(uuid.uuid4())
    await db.maps.insert_one({
        "id": map_id, "title": "Global Business Presence", "slug": "global-business-presence",
        "description": "<p>Our consulting practice spans across major business hubs worldwide.</p>",
        "cover_image": "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800",
        "tags": ["global", "consulting"], "published": True, "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.map_locations.insert_many([
        {"id": str(uuid.uuid4()), "name": "New York Office", "lat": 40.7128, "lng": -74.0060, "description": "Flagship office in Manhattan", "category": "office", "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "London Hub", "lat": 51.5074, "lng": -0.1278, "description": "European headquarters", "category": "office", "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Tokyo Center", "lat": 35.6762, "lng": 139.6503, "description": "Asia-Pacific operations", "category": "office", "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Dubai Office", "lat": 25.2048, "lng": 55.2708, "description": "Middle East regional office", "category": "office", "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Sydney Branch", "lat": -33.8688, "lng": 151.2093, "description": "Oceania operations", "category": "office", "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    await db.gallery.insert_many([
        {"id": str(uuid.uuid4()), "title": "Strategic Planning Session", "summary": "Annual strategy meeting", "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800", "category": "professional", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Team Building Workshop", "summary": "Collaborative team event", "image": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800", "category": "professional", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Client Presentation", "summary": "Quarterly results delivery", "image": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800", "category": "professional", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Office Celebration", "summary": "Year-end celebration", "image": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800", "category": "personal", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Weekend Retreat", "summary": "Mountain retreat", "image": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", "category": "personal", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Networking Event", "summary": "Industry networking", "image": "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800", "category": "professional", "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    await db.portfolio.insert_many([
        {"id": str(uuid.uuid4()), "title": "Startup Solution", "description": "Complete business transformation", "image": "https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=800", "tags": ["marketing", "strategy"], "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Marketing Growth", "description": "200% growth campaign", "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800", "tags": ["business", "solution"], "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Company Skills", "description": "Enterprise training program", "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800", "tags": ["solution"], "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Business Growth Plan", "description": "Strategic growth roadmap", "image": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800", "tags": ["business"], "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    await db.testimonials.insert_many([
        {"id": str(uuid.uuid4()), "name": "David Richardson", "title": "CEO, TechVentures Inc.", "content": "Legacy Consulting transformed our business strategy with 150% revenue growth.", "image": "https://images.unsplash.com/photo-1755519024827-fd05075a7200?crop=entropy&cs=srgb&fm=jpg&q=85", "rating": 5, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Amanda Foster", "title": "COO, GlobalReach Ltd.", "content": "Working with Legacy was a game-changer for our strategic planning.", "image": "https://images.pexels.com/photos/29852895/pexels-photo-29852895.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "rating": 5, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Robert Kim", "title": "Director, InnovateCo", "content": "They helped us navigate complex regulatory challenges. Highly recommended.", "image": "https://images.pexels.com/photos/30004360/pexels-photo-30004360.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "rating": 5, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    await db.pages.insert_many([
        {"page_type": "terms", "title": "Terms of Service", "content": "<h2>Terms of Service</h2><p>Welcome to Legacy Consulting.</p>", "banner_image": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800", "created_at": datetime.now(timezone.utc).isoformat()},
        {"page_type": "privacy", "title": "Privacy Policy", "content": "<h2>Privacy Policy</h2><p>We take your privacy seriously.</p>", "banner_image": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800", "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    await db.nav_pages.insert_many([
        {"id": str(uuid.uuid4()), "title": "Terms of Service", "url": "/terms", "show_in_header": False, "show_in_footer": True, "open_in_new_tab": False, "login_required": False, "order": 1, "banner_image": "", "summary": "Our terms and conditions", "content": "", "page_type": "terms", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Privacy Policy", "url": "/privacy", "show_in_header": False, "show_in_footer": True, "open_in_new_tab": False, "login_required": False, "order": 2, "banner_image": "", "summary": "Our privacy policy", "content": "", "page_type": "privacy", "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    await db.users.insert_one({
        "user_id": f"user_{uuid.uuid4().hex[:12]}", "email": "user@example.com",
        "name": "John Doe", "first_name": "John", "last_name": "Doe",
        "password_hash": hash_password("User123!"), "role": "user",
        "picture": "", "phone": "+1 555-0100",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    logger.info("Seed data created successfully!")

@app.on_event("startup")
async def startup():
    await seed_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    from models.database import client
    client.close()

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"])
