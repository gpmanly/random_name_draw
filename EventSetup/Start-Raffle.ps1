function Start-Raffle{

	$processOptions = @{
		FilePath = "C:\Program Files\Mozilla Firefox\firefox.exe"
		ArgumentList = "--kiosk --private-window $(pwd)\index.html"
		#ArgumentList = "-chrome $(pwd)\index.html"
		WindowStyle = "Normal"
	}
	Start-Process @processOptions
	
}

function Set-RafflePosition{
	
	Set-Window -ProcessName firefox -X 600 -Y 210 -Width 800 -Height 600 -Passthru
}