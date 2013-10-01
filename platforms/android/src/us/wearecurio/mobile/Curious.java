/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */

package us.wearecurio.mobile;

import android.os.Bundle;
import org.apache.cordova.*;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.LOG;
import org.json.JSONException;
import org.json.JSONObject;

import android.annotation.SuppressLint;
import android.app.*;
import android.util.Log;
import android.view.*;
import android.content.Intent;

public class Curious extends Activity implements CordovaInterface
{
    private boolean mAlternateTitle = false;
    private boolean bound;
    private boolean volumeupBound;
    private boolean volumedownBound;
    CordovaWebView mainView;
    private final ExecutorService threadPool = Executors.newCachedThreadPool();
private int activityState = 0;  // 0=starting, 1=running (after 1st resume), 2=shutting down

    // Plugin to call when activity result is received
    protected CordovaPlugin activityResultCallback = null;
    protected boolean activityResultKeepRunning;

    // (this is not the color for the webview, which is set in HTML)
    private static final String TAG = "Curious";
    /*
     * The variables below are used to cache some of the activity properties.
     */

    // Draw a splash screen using an image located in the drawable resource directory.
    // This is not the same as calling super.loadSplashscreen(url)
    protected int splashscreen = 0;
    protected int splashscreenTime = 3000;

    // LoadUrl timeout value in msec (default of 20 sec)
    protected int loadUrlTimeoutValue = 20000;

    // Keep app running when pause is received. (default = true)
    // If true, then the JavaScript and native code continue to run in the background
    // when another application (activity) is started.
    protected boolean keepRunning = true;

    @Override
    public void onCreate(Bundle savedInstanceState)
    {
	super.onCreate(savedInstanceState); 
        setContentView(R.layout.main);
        mainView = (CordovaWebView) this.findViewById(R.id.mainView);
        Config.init(this);
	Log.v(TAG, "Trying to load https://dev.wearecurio.us/mobile/index");
        mainView.loadUrl(Config.getStartUrl(),180000);
    }

    /**
     * Launch an activity for which you would like a result when it finished. When this activity exits,
     * your onActivityResult() method will be called.
     *
     * @param command           The command object
     * @param intent            The intent to start
     * @param requestCode       The request code that is passed to callback to identify the activity
     */
    public void startActivityForResult(CordovaPlugin command, Intent intent, int requestCode) {
        this.activityResultCallback = command;
        this.activityResultKeepRunning = this.keepRunning;

        // If multitasking turned on, then disable it for activities that return results
        if (command != null) {
            this.keepRunning = false;
        }

        // Start activity
        super.startActivityForResult(intent, requestCode);
    }

    public void setActivityResultCallback(CordovaPlugin plugin) {
        this.activityResultCallback = plugin;
    }

    /**
     * Get the Android activity.
     *
     * @return
     */
    public Activity getActivity() {
        return this;
    }

     /**
     * Called when a message is sent to plugin.
     *
     * @param id            The message id
     * @param data          The message data
     * @return              Object or null
     */
    public Object onMessage(String id, Object data) {
	LOG.d(TAG, "onMessage(" + id + "," + data + ")");
	if ("exit".equals(id)) {
	    super.finish();
	}
	return null;    
    }

    public ExecutorService getThreadPool() {
        return threadPool;
    }

    public void cancelLoadUrl() {
        // This is a no-op.
    }
    

    @Override
    /**
     * Called when the system is about to start resuming a previous activity.
     */
    protected void onPause() {
        super.onPause();
 
         // Send pause event to JavaScript
        this.mainView.loadUrl("javascript:try{cordova.fireDocumentEvent('pause');}catch(e){console.log('exception firing pause event from native');};");
 
        // Forward to plugins
        if (this.mainView.pluginManager != null) {
            this.mainView.pluginManager.onPause(true);
        }
    }
 
    @Override
    /**
     * Called when the activity will start interacting with the user.
     */
    protected void onResume() {
        super.onResume();
 
        if (this.mainView == null) {
            return;
        }
 
        // Send resume event to JavaScript
        this.mainView.loadUrl("javascript:try{cordova.fireDocumentEvent('resume');}catch(e){console.log('exception firing resume event from native');};");
 
        // Forward to plugins
        if (this.mainView.pluginManager != null) {
            this.mainView.pluginManager.onResume(true);
        }
 
    }
 
    @Override
    /**
     * The final call you receive before your activity is destroyed.
     */
    public void onDestroy() {
        LOG.d(TAG, "onDestroy()");
        super.onDestroy();
 
        if (this.mainView != null) {
 
            // Send destroy event to JavaScript
            this.mainView.loadUrl("javascript:try{cordova.require('cordova/channel').onDestroy.fire();}catch(e){console.log('exception firing destroy event from native');};");
 
            // Load blank page so that JavaScript onunload is called
            this.mainView.loadUrl("about:blank");
            mainView.handleDestroy();
        }
    }

    @Override
    /**
     * Called when the activity receives a new intent
     **/
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
 
        //Forward to plugins
        if ((this.mainView != null) && (this.mainView.pluginManager != null)) {
            this.mainView.pluginManager.onNewIntent(intent);
        }
    }

}

