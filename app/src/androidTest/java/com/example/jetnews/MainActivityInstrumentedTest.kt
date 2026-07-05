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

import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodes
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.example.jetnews.ui.MainActivity
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class MainActivityInstrumentedTest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun mainActivity_launchesHomeFeed() {
        composeTestRule.onNodeWithText("Top stories for you").assertExists()
    }

    @Test
    fun mainActivity_showsNavigationDestinations() {
        val drawerButtons = composeTestRule
            .onAllNodes(hasContentDescription("Open navigation drawer"), useUnmergedTree = true)
            .fetchSemanticsNodes()

        if (drawerButtons.isNotEmpty()) {
            composeTestRule.onNodeWithContentDescription(
                label = "Open navigation drawer",
                useUnmergedTree = true
            ).performClick()

            composeTestRule.onNodeWithText("Home").assertExists()
            composeTestRule.onNodeWithText("Interests").assertExists()
        } else {
            composeTestRule.onNodeWithContentDescription("Home").assertExists()
            composeTestRule.onNodeWithContentDescription("Interests").assertExists()
        }
    }
}
