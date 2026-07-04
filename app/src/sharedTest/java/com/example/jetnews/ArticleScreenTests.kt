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

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.example.jetnews.data.posts.impl.post3
import com.example.jetnews.ui.article.ArticleScreen
import com.example.jetnews.ui.theme.JetnewsTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ArticleScreenTests {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun compactArticleScreen_displaysPostAndHandlesNavigateUp() {
        var navigateUpClicks = 0

        composeTestRule.setContent {
            JetnewsTheme {
                ArticleScreen(
                    post = post3,
                    isExpandedScreen = false,
                    onBack = { navigateUpClicks++ },
                    isFavorite = false,
                    onToggleFavorite = {}
                )
            }
        }

        composeTestRule.onNodeWithText(post3.title).assertExists()
        composeTestRule.onNodeWithContentDescription("Navigate up").performClick()

        composeTestRule.runOnIdle {
            assertEquals(1, navigateUpClicks)
        }
    }
}
