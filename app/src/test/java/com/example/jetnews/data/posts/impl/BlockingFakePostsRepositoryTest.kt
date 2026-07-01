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

package com.example.jetnews.data.posts.impl

import com.example.jetnews.data.Result
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class BlockingFakePostsRepositoryTest {

    @Test
    fun getPostsFeed_returnsFeedAndUpdatesObservedFeed() = runBlocking {
        val repository = BlockingFakePostsRepository()

        assertNull(repository.observePostsFeed().first())

        val postsFeed = (repository.getPostsFeed() as Result.Success).data

        assertEquals(postsFeed, repository.observePostsFeed().first())
    }

    @Test
    fun toggleFavorite_addsAndRemovesFavoritePost() = runBlocking {
        val repository = BlockingFakePostsRepository()
        val postId = (repository.getPostsFeed() as Result.Success).data.highlightedPost.id

        assertEquals(emptySet<String>(), repository.observeFavorites().first())

        repository.toggleFavorite(postId)
        assertEquals(setOf(postId), repository.observeFavorites().first())

        repository.toggleFavorite(postId)
        assertEquals(emptySet<String>(), repository.observeFavorites().first())
    }
}
