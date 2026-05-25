import os
import base64
from cryptography.fernet import Fernet
from sqlalchemy.orm import Session

from backend.models import TestRun, EncryptedRecord, ValidationStatus


def _get_fernet() -> Fernet:
    key = os.getenv("ENCRYPTION_KEY")
    if not key:
        raise RuntimeError("ENCRYPTION_KEY env var not set")
    return Fernet(key.encode())


class EncryptionService:
    @staticmethod
    def encrypt_and_store(db: Session, owner_id: str, label: str, plaintext: str) -> EncryptedRecord:
        f = _get_fernet()
        ciphertext = f.encrypt(plaintext.encode()).decode()
        record = EncryptedRecord(owner_id=owner_id, label=label, ciphertext=ciphertext)
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def decrypt(ciphertext: str) -> str:
        f = _get_fernet()
        return f.decrypt(ciphertext.encode()).decode()

    @staticmethod
    def generate_key() -> str:
        return Fernet.generate_key().decode()


class TestRunService:
    @staticmethod
    def create(db: Session, owner_id: str, name: str, description: str | None) -> TestRun:
        run = TestRun(owner_id=owner_id, name=name, description=description)
        db.add(run)
        db.commit()
        db.refresh(run)
        return run

    @staticmethod
    def execute(db: Session, run: TestRun) -> TestRun:
        run.status = ValidationStatus.running
        db.commit()

        # Validation logic placeholder — replace with real test runner
        try:
            # Simulate validation checks
            checks = [
                ("schema_validation", True),
                ("data_integrity", True),
                ("encryption_check", True),
            ]
            all_passed = all(result for _, result in checks)
            summary_lines = [f"{name}: {'PASS' if result else 'FAIL'}" for name, result in checks]

            run.status = ValidationStatus.passed if all_passed else ValidationStatus.failed
            run.result_summary = "\n".join(summary_lines)
        except Exception as e:
            run.status = ValidationStatus.failed
            run.result_summary = f"Execution error: {str(e)}"

        db.commit()
        db.refresh(run)
        return run
