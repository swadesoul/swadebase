FROM python:3.12-slim

RUN pip install --no-cache-dir "psycopg[binary]==3.2.12"

WORKDIR /app
COPY src /app/src
COPY catalog /app/catalog
COPY engine/PIN /app/engine/PIN
COPY migrations /app/migrations
COPY docs/PRIMER.md /app/docs/PRIMER.md

ENV PYTHONPATH=/app/src
ENV SWADE_ONTOLOGY_ENABLED=false
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8090
USER nobody

CMD ["python", "-m", "swade_ontology"]
