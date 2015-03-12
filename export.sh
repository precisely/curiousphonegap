cd 'platforms/ios/'
xcodebuild -target Curious -configuration "Release Adhoc" clean

rm -rf dist/Curious.app

xcodebuild -target Curious -configuration "Release Adhoc" PROVISIONING_PROFILE="f5dbeda1-d53c-4b74-b3fa-a667f14277c8" CONFIGURATION_BUILD_DIR=dist

rm -rf archive/Curious.xcarchive

xcodebuild -scheme Curious -configuration "Release Adhoc" archive PROVISIONING_PROFILE="f5dbeda1-d53c-4b74-b3fa-a667f14277c8" CODE_SIGN_IDENTITY="iPhone Distribution: Curious, Inc. (4Q8FA374L5)" -archivePath ./archive/Curious.xcarchive

rm -rf export/Curious.ipa

xcodebuild -exportArchive -exportFormat IPA -exportProvisioningProfile XC\ Ad\ Hoc:\ us.wearecurio.app -archivePath ./archive/Curious.xcarchive -exportPath ./export/Curious.ipa
