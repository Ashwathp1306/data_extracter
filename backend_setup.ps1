$backend_dir = "C:\leetcode_extracter\backend"
$app_dir = "$backend_dir\app"

New-Item -ItemType Directory -Force -Path "$app_dir\api"
New-Item -ItemType Directory -Force -Path "$app_dir\services"
New-Item -ItemType Directory -Force -Path "$app_dir\models"
New-Item -ItemType Directory -Force -Path "$app_dir\utils"

New-Item -ItemType File -Force -Path "$app_dir\__init__.py"
New-Item -ItemType File -Force -Path "$app_dir\api\__init__.py"
New-Item -ItemType File -Force -Path "$app_dir\services\__init__.py"
New-Item -ItemType File -Force -Path "$app_dir\models\__init__.py"
New-Item -ItemType File -Force -Path "$app_dir\utils\__init__.py"

Set-Content -Path "$backend_dir\requirements.txt" -Value "fastapi
uvicorn
pydantic
pandas
openpyxl
httpx
python-multipart"
