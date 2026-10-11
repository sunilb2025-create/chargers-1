# Green Home Score and Retrofit Recommendation Engine

## Prerequisites

- Python 3.12
- Node.js LTS and npm
- Git

## Installation

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd YOUR_REPOSITORY_FOLDER
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Backend Setup

Create and activate a virtual environment.

**Windows PowerShell:**

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```powershell
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

Create a `.env` file from `.env.example` if the project requires environment variables. Configure the required values locally.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

Open two terminals from the repository root.

### Backend

Activate the virtual environment and run:

```bash
python -m uvicorn app.main:app --reload --app-dir backend --port 8000
```

API documentation:

http://127.0.0.1:8000/docs

### Frontend

```bash
cd frontend
npm run dev
```

Open the local URL printed by Vite in your browser.

## Dataset and Model Downloads

- Dataset: https://epc.opendatacommunities.org/
- Property sales data: https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads
- Carbon emission factors: https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting
- Model weights: No externally hosted model weights are required, if models are trained locally from the provided training scripts.

Download and prepare the required datasets according to the project's data preparation instructions. Follow the applicable dataset licences and terms.

## Configuration

If the application uses an external LLM API, configure the required API key in the backend `.env` file. Do not commit secrets to the repository.
