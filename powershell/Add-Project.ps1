param(
        [Parameter(Mandatory=$true)]
        [ValidateSet("project", "feature", "foundation")]
        [string]$Type,
        [Parameter(Mandatory=$true)]
        [string]$SolutionFile,
        [Parameter(Mandatory=$true)]
        [string]$Name,
        [Parameter(Mandatory=$true)]
        [string]$ProjectPath,
        [Parameter(Mandatory=$true)]
        [string]$SolutionFolderName)

Import-Module $PSScriptRoot\Add-Project.psm1 -Scope Local
Add-Project -Type $Type -SolutionFile $SolutionFile -Name $Name -ProjectPath $ProjectPath -SolutionFolderName $SolutionFolderName