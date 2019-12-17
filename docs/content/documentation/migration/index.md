---
title: Migration
summary: Getting started with the Concierge migration tool.
weight: 120
---

This page describes the migration workflow currently available in Concierge.

### Google spreadsheet

Migration data has been prepared in a Google spreadsheet. The spreadsheet can be imported and read in Concierge.
The sheet is read-only and it's not possible to make changes from within Concierge.

- In the navigation menu on the left, click `Migration`.
- If the list is empty or if you want to re-import the spreadsheet, click `Fetch Spreadsheet` in the top right
corner of the sheet.
- Click on the column headers to sort the sheet, and type in the query field on the top left to perform a full text
search.
- Models with a `Migrate Play` action can be migrated from Autodesk Play automatically. Click the button to
auto-generate a migration job.

### Editing and starting a migration job

- In the migration spreadsheet, click the `Migrate Play` button to create a new migration job
- In the job details view, double-check all entries.
- Adjust the migration settings if necessary
   - *Annotation Style* determines how annotations will be displayed
   - *Migrate Annotation Color* displays annotations in their original color if activated
   - *Create Reading Tour Steps* creates additional steps in tours where articles are displayed. In Voyager, the
   article reader is displayed on top of the 3D scene. Enabling this option is necessary for the user to be able
   to read articles in an extra tour step.
- When happy, click `Create Migration Job` to actually create the job
- The UI then displays the list of jobs

### Starting a migration job

- Migration jobs initially have the state `created` and can be started by clicking the `Play` button on the left
of an entry.
- The UI updates automatically to show the job's state and progress. Once the job is completed, the state switches to
`Done`. If there is an error, the state switches to `Error` and the reason for the error is displayed.
- For models with a master geometry and texture, a second job is automatically created. You can use this job to reprocess
the master model and create a second Voyager scene with updated derivatives.

#### A - Play Migration Job
- Reads all assets from a Play box with a given ID.
- Converts assets to glTF/GLB, creates a Thumb, Low, Medium, and High resolution representation.
- Creates a new Voyager document
- Migrates all annotations, articles and tours

##### Deliverables
The Play Migration Job creates a new subject and item for each Play box. The item contains 3 bins:

- Bin 1 contains the original Play box assets
- Bin 2 contains all intermediate files created during migration
- Bin 3 contains the converted Voyager scene including all assets, articles and media files

#### B - Master Migration Job
- Is created automatically after a migration job completes for Play boxes associated with a master geometry and texture file.
- Creates Thumb, Low, Medium and High derivatives from the master model
- Copies the migrated Voyager scene and augments the copy with the created derivatives

##### Deliverables
The Master Migration Job creates 2 additional bins:

- Bin 4 contains all intermediate files created during the job
- Bin 5 contains a copy of the migrated Voyager scene where all derivatives have been replaced with the reprocessed ones.
