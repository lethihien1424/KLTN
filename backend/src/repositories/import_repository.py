from sqlalchemy.orm import Session


class ImportRepository:
    @staticmethod
    def add(
        db: Session,
        model,
    ):
        db.add(model)

        return model

    @staticmethod
    def flush(
        db: Session,
    ) -> None:
        db.flush()

    @staticmethod
    def commit(
        db: Session,
    ) -> None:
        db.commit()

    @staticmethod
    def rollback(
        db: Session,
    ) -> None:
        db.rollback()