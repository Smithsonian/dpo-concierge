/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from "react";

import SvgIcon from "@material-ui/core/SvgIcon";

////////////////////////////////////////////////////////////////////////////////

export const ModelIcon = (props) => (
    <SvgIcon viewBox="0 0 512 512" {...props}>
        <path d="M239.1 7.5l-208 78c-18.7 7-31.1 25-31.1 45v225.1c0 18.2 10.3 34.8 26.5 42.9l208 104c13.5 6.8 29.4 6.8 42.9 0l208-104c16.3-8.1 26.5-24.8 26.5-42.9V130.5c0-20-12.4-37.9-31.1-44.9l-208-78C262 3.4 250 3.4 239.1 7.5zm16.9 45l208 78v.3l-208 84.5-208-84.5v-.3l208-78zM48 182.6l184 74.8v190.2l-184-92v-173zm232 264.9V257.4l184-74.8v172.9l-184 92z"/>
    </SvgIcon>
);

export const SceneIcon = (props) => (
    <SvgIcon viewBox="0 0 512 512" {...props}>
        <path d="M422.06 113.61c-5.57-34.13-30.33-53.78-50-61.32-11.16-16.85-34.37-36.17-67.58-35.77A80.37 80.37 0 0 0 255.57 0a78.42 78.42 0 0 0-48.39 16.52c-20.08-.33-49.35 7.9-67.7 35.78a80.15 80.15 0 0 0-50.21 61.36C60.35 140 60.84 173.53 68.34 195.94v.38l39.36 288A32.05 32.05 0 0 0 139.45 512h232.69a32 32 0 0 0 31.78-27.68L443 198.46c13.56-37.63-2.83-68.46-20.94-84.85zM153.45 464l-35-256h50.39l21.38 256zm119.65 0h-34.6l-21.39-256h77.37zm85 0h-36.74l21.38-256h50.39zM114.42 160c7.38-16.75 21.92-18.55 25.59-18.91a30.59 30.59 0 0 1 .25-29.51c10.3-19 29.91-16.79 34.14-15.9a31.58 31.58 0 0 1 21.73-29.5 30.59 30.59 0 0 1 29.08 5c1-3.55 8.08-23.23 30.36-23.23 21.49 0 30.57 18.91 30.57 23.23a31.15 31.15 0 0 1 29.3-5 31.56 31.56 0 0 1 21.75 29.5c4.23-.89 23.86-3.09 34.12 15.9a32 32 0 0 1 .27 29.51c7.69.77 19.37 4.79 25.58 18.91z"/>
    </SvgIcon>
);

export const ConciergeIcon = (props) => (
    <SvgIcon viewBox="0 0 512 512" {...props}>
        <path d="M288 130.54V112h16c8.84 0 16-7.16 16-16V80c0-8.84-7.16-16-16-16h-96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h16v18.54C115.49 146.11 32 239.18 32 352h448c0-112.82-83.49-205.89-192-221.46zM496 384H16c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h480c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16z"/>
    </SvgIcon>
);