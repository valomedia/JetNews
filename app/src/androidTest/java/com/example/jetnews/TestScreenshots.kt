/*
 * Copyright (c) 2020-2025.
 * The Android Open Source Project, valo.media GmbH
 * All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.example.jetnews

import android.graphics.Bitmap
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.onRoot
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import java.io.FileOutputStream

private const val SCREENSHOT_DIRECTORY_NAME = "test-screenshots"

fun ComposeContentTestRule.saveScreenshot(name: String): File {
    waitForIdle()

    val screenshot = onRoot().captureToImage().asAndroidBitmap()
    val screenshotDirectory = File(externalFilesDirectory(), SCREENSHOT_DIRECTORY_NAME)
        .also { it.mkdirs() }
    val screenshotFile = File(screenshotDirectory, "$name.png")

    FileOutputStream(screenshotFile).use { stream ->
        screenshot.compress(Bitmap.CompressFormat.PNG, 100, stream)
    }

    return screenshotFile
}

private fun externalFilesDirectory(): File = requireNotNull(
    InstrumentationRegistry.getInstrumentation()
        .targetContext
        .getExternalFilesDir(null)
) {
    "External files directory is unavailable"
}
