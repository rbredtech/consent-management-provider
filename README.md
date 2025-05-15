# Consent Management Provider for HbbTV

This service implements a consent management provider based on the [TCFv2](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md) standard which can be used in HbbTV APPs.

To be able to access the same consent decision across multiple HbbTV apps (which are possibly hosted on different domains),
an iframe is used and the storage cookie is associated with the iframe document. Additionally, the consent information is
also stored in the `localStorage` associated with the iframe.

The consent management solution also supports a configurable sampling rate which controls how frequently an end user would
be prompted for a consent decision. Users who should not be asked for consent will not receive a `loaded` status through
the consent management `getTCData` callback.

Integration documentation can be found at https://docs.tv-insight.com/docs/hbbtv-tracking/cross-channel-consent-management.

## Compliance

At this time no actually encoded TC String is used. Currently the unregistered vendor IDs `4040` and `4041` are used for AGTT channels, and `5050` is used for AGF channels.

## Usage

Usage/Integration examples can be found in the `/examples` folder of this repository.

## Development

### Get started

To configure the service for local execution, create a `.env` (`.env.example` can be used as a template) and set the
values in that file accordingly.

Install dependencies with

- `yarn install`

To run during development use

- `yarn dev`

To create a build you can use

- `yarn build`

to create a build in the `/dist` folder and

- `yarn serve-dist`

to serve ist from `localhost:9999`

> [!TIP]
> This project uses [Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
> for adding new features and creating new releases. It is advised to install the
> [Gitflow extension](https://skoch.github.io/Git-Workflow/) on your system.

### Propose a change/feature

In order to propose a new feature/a change or bugfix, a feature branch named `feature/[descriptive-name]`
needs to be created from the `develop` branch. After adding the desired changes to this branch, a pull request
needs to be opened and reviewed before the changes can be merged into the `develop` branch.

Every push/merge to the `develop` branch creates a snapshot tag (e.g. `v0.1.2_snapshot_26`) which makes it easier
to inspect all changes since the currently released version (which would be `v0.1.2` for the given example).

## Releases

Creating a new release follows the gitflow pattern of creating a release branch named `release/vx.x.x`
(the pattern `"v" + version number` is mandatory), which upon wrapping up creates a tag with the release name (e.g. `v1.0.1`),
and the branch gets merged back into `master`.

When a new release is tagged, a docker image containing this version of the app is created. This image is
then pushed to <https://github.com/rbredtech/consent-management-provider/pkgs/container/consent-management-provider>.
