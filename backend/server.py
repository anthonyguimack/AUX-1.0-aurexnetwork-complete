from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

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
from routes.membership import router as membership_router
from routes.landing import router as landing_router
from routes.enrollment import router as enrollment_router
from routes.docs import router as docs_router
from routes.calendar_events import router as calendar_events_router
from routes.mentor_slots import router as mentor_slots_router

api_router.include_router(auth_router)
api_router.include_router(public_router)
api_router.include_router(admin_content_router)
api_router.include_router(admin_tools_router)
api_router.include_router(payments_router)
api_router.include_router(membership_router)
api_router.include_router(landing_router)
api_router.include_router(enrollment_router)
api_router.include_router(docs_router)
api_router.include_router(calendar_events_router)
api_router.include_router(mentor_slots_router)

# Import seed data function
from seed import seed_data

@app.on_event("startup")
async def startup():
    await seed_data()
    from routes.enrollment import seed_enrollment_fields
    await seed_enrollment_fields()
    from scheduler import start_scheduler
    start_scheduler()

@app.on_event("shutdown")
async def shutdown_db_client():
    from scheduler import stop_scheduler
    stop_scheduler()
    from models.database import client
    client.close()

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"])
