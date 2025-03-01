import {DialogContent, DialogContentText, Typography } from '@mui/material';

function About() {

return (
<DialogContent>
    <DialogContentText id="about-dialog-description">
        <Typography>
        <strong>Developer:</strong> Adnan Hafeez
        </Typography>
        <Typography>
        <strong>Organization:</strong> ARC (Advanced Research Computing) - University of Michigan
        </Typography>
        <Typography>
        <strong>Version:</strong> 0.0.1
        </Typography>
        <Typography>
        <strong>Last Update:</strong> 2024/07/12
        </Typography>
    </DialogContentText>
</DialogContent>
);
};


export default About;
