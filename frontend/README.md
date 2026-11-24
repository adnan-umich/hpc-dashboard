# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Slurm license investigation

Open **Licenses → Advanced investigation**. Select a cluster and a UTC start/end
interval (up to 93 days), optionally enter an exact uniqname and/or Slurm account,
and select **Retrieve Slurm jobs**. Both identity filters apply when provided.
The end timestamp is exclusive. The graph shows exact concurrent requested license units
by uniqname or account; click a timestamp to inspect its contributing job records.
Use **Inspect all retrieved jobs** to include jobs without the selected license.

The frontend calls `GET /licenses/investigate/` with `cluster`, `start`, `end`,
`uniqname`, and `account`. The backend retrieves overlapping intervals from
`slurm_greatlakes` by default for Great Lakes. It includes jobs that started before
the window and running jobs through the response snapshot. Jobs without valid
execution intervals are excluded and reported. Queued jobs have no execution
interval to plot. Queries matching more than 50,000 jobs require narrower filters.

The endpoint shares the existing `LICENSE_ES_URL`, `LICENSE_ES_API_KEY`, and
`LICENSE_ES_INDEX_<CLUSTER>` settings. Default source fields and overrides are:

| Source field | Override |
| --- | --- |
| `@start` | `LICENSE_ES_START_FIELD` |
| `@end` | `LICENSE_ES_END_FIELD` |
| `user` | `LICENSE_ES_USER_FIELD` |
| `account` | `LICENSE_ES_ACCOUNT_FIELD` |
| `state` | `LICENSE_ES_STATE_FIELD` |
| `tres_req` | `LICENSE_ES_TRES_FIELD` |
| `jobid` | `LICENSE_ES_JOB_ID_FIELD` |
| `job_name` | `LICENSE_ES_NAME_FIELD` |

Timestamps must include a timezone. Counts sum concurrent job requests at each timestamp and change at job start/end
events. No hourly averaging is applied.
Capacity metrics and CSV export include all matching groups for the selected
license, even when graph lines are hidden. Pool capacity is entered by the user.
These values represent Slurm requests, not actual license-server checkouts.

The optional `license` query parameter filters retrieved jobs by exact license
type and combines with uniqname/account filters. `abaqus` and
`abaqus@slurmdb` both match the Abaqus pool; `ansys` does not match `ansys_hpc`.
The retrieval form includes the supplied `scontrol show lic` catalog.
Great Lakes capacity defaults use its supplied totals and remain editable;
these are reference values, not live totals or historical capacity records.
Other clusters require manual capacity entry. Zero capacity is supported.
