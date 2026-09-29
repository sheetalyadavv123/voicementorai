.PHONY: install migrate dev worker

install:
	python3.12 -m venv .venv
	.venv/bin/pip install --upgrade pip
	.venv/bin/pip install -r requirements.txt

migrate:
	.venv/bin/alembic upgrade head

dev:
	.venv/bin/uvicorn main:app --reload --port 8000

worker:
	.venv/bin/python -m agent.worker dev
