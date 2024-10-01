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

package com.example.jetnews.model

import androidx.annotation.DrawableRes
import com.example.jetnews.R
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Post(
    val id: String,
    val title: String,
    val subtitle: String? = null,
    val url: String,
    val publication: Publication? = null,
    val metadata: Metadata,
    val paragraphs: List<Paragraph> = emptyList(),
    val imageUrl: String,
    val imageThumbUrl: String,
    @DrawableRes val imageId: Int = R.drawable.post_6,
    @DrawableRes val imageThumbId: Int = R.drawable.post_6_thumb
)

@Serializable
data class Metadata(
    val author: PostAuthor,
    val date: String,
    val readTimeMinutes: Int
)

@Serializable
data class PostAuthor(
    val name: String,
    val url: String? = null
)

@Serializable
data class Publication(
    val name: String,
    val logoUrl: String
)

@Serializable
data class Paragraph(
    val type: ParagraphType,
    val text: String,
    val markups: List<Markup> = emptyList()
)

@Serializable
data class Markup(
    val type: MarkupType,
    val start: Int,
    val end: Int,
    val href: String? = null
)

@Serializable
enum class MarkupType {
    @SerialName("link")
    Link,
    @SerialName("code")
    Code,
    @SerialName("italic")
    Italic,
    @SerialName("bold")
    Bold,
}

@Serializable

enum class ParagraphType {
    @SerialName("title")
    Title,
    @SerialName("caption")
    Caption,
    @SerialName("header")
    Header,
    @SerialName("subhead")
    Subhead,
    @SerialName("text")
    Text,
    @SerialName("code-block")
    CodeBlock,
    @SerialName("quote")
    Quote,
    @SerialName("bullet")
    Bullet,
}