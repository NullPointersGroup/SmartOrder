cd frontend
npm run test
cd ../backend
source .venv/bin/activate
mypy src
pytest

