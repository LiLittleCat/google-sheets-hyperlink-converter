param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

if (-not $Version.StartsWith("v")) {
    $Version = "v" + $Version
}

$FolderName = "google-sheets-hyperlink-converter-$Version"
$ZipName = "$FolderName.zip"

# Remove existing zip and folder if exists
if (Test-Path $ZipName) {
    Remove-Item $ZipName
}
if (Test-Path $FolderName) {
    Remove-Item $FolderName -Recurse
}

# Create temp folder and copy files
New-Item -ItemType Directory -Path $FolderName
Copy-Item -Path @(
    "manifest.json",
    "background.js",
    "content.js",
    "i18n.js",
    "icon48.png",
    "icon128.png"
) -Destination $FolderName

# Create zip file
Compress-Archive -Path $FolderName -DestinationPath $ZipName

# Clean up temp folder
Remove-Item $FolderName -Recurse

Write-Host "Created $ZipName successfully!" 