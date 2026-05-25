from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, TestRun, EncryptedRecord, ValidationStatus
from backend.routers.auth import get_current_user
from backend.services.core import EncryptionService, TestRunService

router = APIRouter()


class TestRunCreate(BaseModel):
    name: str
    description: str | None = None


class TestRunOut(BaseModel):
    id: str
    name: str
    description: str | None
    status: ValidationStatus
    result_summary: str | None

    model_config = {"from_attributes": True}


class EncryptRequest(BaseModel):
    label: str
    plaintext: str


class DecryptRequest(BaseModel):
    record_id: str


class EncryptedRecordOut(BaseModel):
    id: str
    label: str
    created_at: str

    model_config = {"from_attributes": True}


CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("/test-runs", response_model=list[TestRunOut])
def list_test_runs(current_user: CurrentUser, db: Session = Depends(get_db)):
    return db.query(TestRun).filter(TestRun.owner_id == current_user.id).all()


@router.post("/test-runs", response_model=TestRunOut, status_code=status.HTTP_201_CREATED)
def create_test_run(body: TestRunCreate, current_user: CurrentUser, db: Session = Depends(get_db)):
    run = TestRunService.create(db, owner_id=current_user.id, name=body.name, description=body.description)
    return run


@router.post("/test-runs/{run_id}/execute", response_model=TestRunOut)
def execute_test_run(run_id: str, current_user: CurrentUser, db: Session = Depends(get_db)):
    run = db.query(TestRun).filter(TestRun.id == run_id, TestRun.owner_id == current_user.id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Test run not found")
    run = TestRunService.execute(db, run)
    return run


@router.delete("/test-runs/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test_run(run_id: str, current_user: CurrentUser, db: Session = Depends(get_db)):
    run = db.query(TestRun).filter(TestRun.id == run_id, TestRun.owner_id == current_user.id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Test run not found")
    db.delete(run)
    db.commit()


@router.post("/encrypt", response_model=EncryptedRecordOut, status_code=status.HTTP_201_CREATED)
def encrypt_data(body: EncryptRequest, current_user: CurrentUser, db: Session = Depends(get_db)):
    record = EncryptionService.encrypt_and_store(db, owner_id=current_user.id, label=body.label, plaintext=body.plaintext)
    return EncryptedRecordOut(id=record.id, label=record.label, created_at=record.created_at.isoformat())


@router.post("/decrypt")
def decrypt_data(body: DecryptRequest, current_user: CurrentUser, db: Session = Depends(get_db)):
    record = db.query(EncryptedRecord).filter(
        EncryptedRecord.id == body.record_id,
        EncryptedRecord.owner_id == current_user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    plaintext = EncryptionService.decrypt(record.ciphertext)
    return {"plaintext": plaintext}


@router.get("/encrypted-records", response_model=list[EncryptedRecordOut])
def list_encrypted_records(current_user: CurrentUser, db: Session = Depends(get_db)):
    records = db.query(EncryptedRecord).filter(EncryptedRecord.owner_id == current_user.id).all()
    return [EncryptedRecordOut(id=r.id, label=r.label, created_at=r.created_at.isoformat()) for r in records]
