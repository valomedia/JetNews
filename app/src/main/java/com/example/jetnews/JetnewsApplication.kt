/*
 * Copyright 2020 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.example.jetnews

import android.app.Application
import android.util.Log
import com.android.volley.Request
import com.android.volley.RequestQueue
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.example.jetnews.data.AppContainer
import com.example.jetnews.data.AppContainerImpl
import org.json.JSONObject


class JetnewsApplication : Application() {
    companion object {
        const val JETNEWS_APP_URI = "https://developer.android.com/jetnews"
    }

    // AppContainer instance used by the rest of classes to obtain dependencies
    lateinit var container: AppContainer

    private lateinit var requestQueue: RequestQueue

    override fun onCreate() {
        super.onCreate()
        container = AppContainerImpl(this)

        //Initialize new Volley RequestQueue
        requestQueue = Volley.newRequestQueue(this)

        fetchJsonWithVolley("https://srv.valo-dev.de/public/jetnews/posts.json")

    }

    private fun fetchJsonWithVolley(url: String) {

        val jsonObjectRequest = JsonObjectRequest(
            Request.Method.GET, url, null,
            { response: JSONObject ->
                // Retrieval of JSONObj, output into logcat
                val jsonResponse = response
                //Log.d("DebugMalik", "Response: $response")
                Log.d("DebugMalik",jsonResponse.toString())
            },
            { error ->
                // Output in case of Error
                Log.e("ErrorMalik", "Error: ${error.message}")
            }
        )

        requestQueue.add(jsonObjectRequest)

    }

    @Override
    fun onStop() {
        // Beende alle Anfragen, die dieser Aktivität zugeordnet sind
        requestQueue.cancelAll(this)
    }

}
