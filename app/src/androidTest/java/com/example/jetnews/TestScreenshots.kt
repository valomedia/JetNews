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

import android.os.ParcelFileDescriptor
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File

private const val SCREENSHOT_ARTIFACT_DIRECTORY = "/sdcard/Download/jetnews-test-screenshots"
private val screenshotNamePattern = Regex("[A-Za-z0-9._-]+")

fun ComposeContentTestRule.saveScreenshot(name: String): File {
    require(screenshotNamePattern.matches(name)) {
        "Screenshot name may only contain letters, numbers, periods, underscores, and dashes"
    }

    waitForIdle()

    val screenshotFile = File(SCREENSHOT_ARTIFACT_DIRECTORY, "$name.png")
    runShellCommand("mkdir -p ${SCREENSHOT_ARTIFACT_DIRECTORY.shellQuote()}")
    runShellCommand("screencap -p ${screenshotFile.absolutePath.shellQuote()}")
    verifyScreenshotCreated(screenshotFile)

    return screenshotFile
}

private fun verifyScreenshotCreated(screenshotFile: File) {
    val output = runShellCommand("ls -l ${screenshotFile.absolutePath.shellQuote()}")
    val screenshotLine = output.lineSequence()
        .firstOrNull { it.startsWith("-") && it.endsWith(screenshotFile.name) }

    check(screenshotLine != null) {
        "Screenshot was not written to ${screenshotFile.absolutePath}"
    }

    val fileSize = screenshotLine
        .split(Regex("\\s+"))
        .getOrNull(4)
        ?.toLongOrNull()

    check(fileSize != null && fileSize > 0) {
        "Screenshot at ${screenshotFile.absolutePath} is empty"
    }
}

private fun runShellCommand(command: String): String {
    val descriptor = InstrumentationRegistry.getInstrumentation()
        .uiAutomation
        .executeShellCommand(command)

    return ParcelFileDescriptor.AutoCloseInputStream(descriptor)
        .bufferedReader()
        .use { reader -> reader.readText() }
}

private fun String.shellQuote(): String = "'${replace("'", "'\\''")}'"
