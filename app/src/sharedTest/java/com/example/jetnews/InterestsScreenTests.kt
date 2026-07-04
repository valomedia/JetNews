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

import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.assertDoesNotExist
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.example.jetnews.ui.interests.InterestsScreen
import com.example.jetnews.ui.interests.Sections
import com.example.jetnews.ui.interests.TabContent
import com.example.jetnews.ui.theme.JetnewsTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class InterestsScreenTests {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun compactInterestsScreen_handlesDrawerClick() {
        var drawerClicks = 0

        composeTestRule.setContent {
            JetnewsTheme {
                InterestsScreen(
                    tabContent = testTabs(),
                    currentSection = Sections.Topics,
                    isExpandedScreen = false,
                    onTabChange = {},
                    openDrawer = { drawerClicks++ },
                    snackbarHostState = remember { SnackbarHostState() }
                )
            }
        }

        composeTestRule.onNodeWithContentDescription("Open navigation drawer").performClick()

        composeTestRule.runOnIdle {
            assertEquals(1, drawerClicks)
        }
    }

    @Test
    fun interestsScreen_switchesTabs() {
        composeTestRule.setContent {
            JetnewsTheme {
                var currentSection by remember { mutableStateOf(Sections.Topics) }
                InterestsScreen(
                    tabContent = testTabs(),
                    currentSection = currentSection,
                    isExpandedScreen = false,
                    onTabChange = { currentSection = it },
                    openDrawer = {},
                    snackbarHostState = remember { SnackbarHostState() }
                )
            }
        }

        composeTestRule.onNodeWithText("Topics content").assertExists()
        composeTestRule.onNodeWithText("People").performClick()

        composeTestRule.onNodeWithText("People content").assertExists()
        composeTestRule.onNodeWithText("Topics content").assertDoesNotExist()
    }

    private fun testTabs(): List<TabContent> = listOf(
        TabContent(Sections.Topics) { Text("Topics content") },
        TabContent(Sections.People) { Text("People content") },
        TabContent(Sections.Publications) { Text("Publications content") }
    )
}
