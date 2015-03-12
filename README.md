#Overview
The app comprises of two parts. The cordova shell which contains various platform versions of the app, referred to as "cordova app". And an inner core that has the actual implementation and business logic which resides at [https://github.com/syntheticzero/curiousmobile](https://github.com/syntheticzero/curiousmobile). This core we will call it "famo.us app" is added to this repo as a git sub-module

#Dependencies
Download and install the following dependencies
	
	1. XCode
	2. npm
	3. cordova


#Certificates and Developer Account

1. In the Xcode Preferences window, click Accounts.
2. Add appledev@wearecurio.us account
2. Click "View Details".
![Developer Accounts](https://developer.apple.com/library/mac/documentation/IDEs/Conceptual/AppDistributionGuide/Art/12_viewdetailsbutton_2x.png)

3. Add a distribution and development profile

More info and xcode setup can be found [here](https://developer.apple.com/library/mac/documentation/IDEs/Conceptual/AppDistributionGuide/MaintainingCertificates/MaintainingCertificates.html)

#One Time Setup
Get the cordova shell app
	
	git clone git@github.com:syntheticzero/curiousphonegap.git

Get the latest famo.us app at repo 
	
	git submodule update --init
	cd famous-app

This project relies on grunt-cli, and bower to do all the heavy lifting for you
	
	sudo npm install -g grunt-cli bower
	sudo npm install && bower install
	
Replace FastClick at `famous-app/app/lib/famous/src/inputs/FastClick.js` with the tweaked version `git@gist.github.com:/5cd7fb3894e08de5c46a.git`

# Build and Deploy
1. Go to cordova app root directory `./build.sh`
2. Open platforms/ios/Curious.xcodeproj in xcode
3. Connect an iOS device to your Mac.
4. In the project navigator, choose your device from the Scheme toolbar menu.
Xcode assumes you intend to use the selected device for development and automatically registers it for you.
![Scheme Image](https://developer.apple.com/library/mac/documentation/IDEs/Conceptual/AppDistributionGuide/Art/5_launchappondevice_2x.png)
More info at [Apple Developer Site](https://developer.apple.com/library/mac/documentation/IDEs/Conceptual/AppDistributionGuide/LaunchingYourApponDevices/LaunchingYourApponDevices.html#//apple_ref/doc/uid/TP40012582-CH27-SW1)

