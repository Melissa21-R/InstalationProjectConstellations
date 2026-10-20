/*
 * ml5.js license of Library used for this project: https://ml5js.org/license
 * for this Project I wanted to make something that I would see at the childrens discovery museum
 * Make Constelations by posing and add them to your starry night sky! 
 * To make it more fun your head star will connect to the closet dot to it encourging you to pose in fun ways!
 */

let video;
let bodyPose;
let poses = []; //each element in poses is a different person so multiple people can be in the camera
let connections;
let confidenceThresh = 0.05;
let scene = 0; //0 is the first scene IE camera, 1 is the sky scene
let constellations = [];
let countdown = 0;
let randomArrayPoints = [];
let bgStars = [];


function preload()
{
	// Load the bodyPose model
	bodyPose = ml5.bodyPose();
}

function setup()
{
	createCanvas(640, 640);

	// Create the video and hide it
	video = createCapture(VIDEO);
	video.size(640, 480);
	video.hide();

	// Start detecting poses in the webcam video
	bodyPose.detectStart(video, gotPoses);
	// Get the skeleton connection information
	connections = bodyPose.getSkeleton();

	//make some background stars
	for(let i = 0; i < 150; i++)
	{
		bgStars.push({
			x: random(width),
			y: random(height),
			size: random(1, 2.5),
			alpha: random(40, 140),
			phase: random(TWO_PI)
		});
	}
}

function draw()
{
	background(scene == 0 ? color(0) : color(5, 8, 25));

	//buttons (I put them as no stroke so they dont pick up on constellation line color)
	fill("lightyellow");
	rect(80, 530, 150, 50, 5);

	//check which scene is happening if its 0 show camera if 1 show night sky
	if (scene == 0)
	{
		noStroke();
		fill("black");
		//textWeight(100); 
		textSize(15);
		text("Switch to Night Sky", 90, 560);
		
		fill("gold");
		rect(400, 530, 150, 50, 5);
		drawPreview();
		fill("black");
		textSize(15);
		text("Take Picture", 430, 560);
		fill("white");
		textSize(25);
		text("Take a Picture and Pose!", 160, 620);
	}
	else
	{
		fill("black");
		//textWeight(100); 
		textSize(15);
		text("Switch to Camera", 95, 560);
		drawSky();
		drawStars();
	}
}

//will draw one pose as a glowing constellation
function drawConstellation(keyPoint, x, y, sc, theta)
{
	push();
	translate(x, y);
	scale(sc);
	rotate(theta);
	translate(-320, -240);

	let headX = 0;
	let headY = 0;
	let headCount = 0;


	//averging the 5 points together
	for(let i = 0; i < 5; i++)
	{
		if(keyPoint[i].confidence > confidenceThresh)
		{
			headX += keyPoint[i].x; 
			headY += keyPoint[i].y;
			headCount++;
		}
	}
	headX /= headCount;
	headY /= headCount;

	//drawing the faint lines between points
	stroke(180, 200, 255, 110);
	strokeWeight(1);
	for (let i = 0; i < connections.length; i++)
	{
		let pointA = keyPoint[connections[i][0]];
		let pointB = keyPoint[connections[i][1]];
		if(connections[i][0] < 5 || connections[i][0] < 5)
		{
			continue;
		}
		// Only draw a line if both points are confident enough
		if (pointA.confidence > confidenceThresh && pointB.confidence > confidenceThresh)
		{
			line(pointA.x, pointA.y, pointB.x, pointB.y);
		}
	}
	
	//drawing the line to the head based on closest point to the head (to make it cool, and so you can make fun shapes if you were raising your arms or rolling on the ground)
	if(headCount > 0)
	{
		let closestPoint = null;
		for(let i = 5; i < keyPoint.length; i++)
		{
			if(keyPoint[i].confidence > confidenceThresh)
			{
				if(closestPoint == null || dist(headX, headY, closestPoint.x, closestPoint.y) > dist(headX, headY, keyPoint[i].x, keyPoint[i].y))
				{
					closestPoint = keyPoint[i]; 
				}
			}
		}
		if(closestPoint != null)
		{
			line(headX, headY, closestPoint.x, closestPoint.y); 
		}
		//draw the head point bigger like the strongest star in a constellation
		noStroke();
		for (let j = 24; j > 0; j -= 6)
		{
			fill(200, 220, 255, 12);
			circle(headX, headY, j*3);
		}
		fill(255);
		circle(headX, headY, 8);
	}

	// Draw all the tracked landmark points as glowing stars
	noStroke();
	for (let i = 5; i < keyPoint.length; i++)
	{
		let currentKP = keyPoint[i];
		// Only draw a circle if the keypoint's confidence is bigger than 0.1
		if (currentKP.confidence > confidenceThresh)
		{
			for (let j = 24; j > 0; j -= 6)
			{
				fill(200, 220, 255, 12);
				circle(currentKP.x, currentKP.y, j);
			}
			fill(255);
			circle(currentKP.x, currentKP.y, 4);
		}
	}
	pop();
}


function drawPreview()
{
	// Draw the webcam video
	image(video, 0, 0, width, 480);

	noStroke();
	fill(5, 8, 25, 150);
	rect(0, 0, width, 480);

	for (let i = 0; i < poses.length; i++)
	{
		drawConstellation(poses[i].keypoints, width / 2, 240, 1, 0);
	}

	if (countdown > 0)
	{
		countdown -= deltaTime / 1000;
		if (countdown <= 0)
		{
			for (let i = 0; i < poses.length; i++)
			{
				constellations.push(poses[i]);
			}
			//replace the oldest constellation with the newest one
			while(constellations.length > 6)
			{
				constellations.shift();
			}
		}
		else
		{
			noStroke();
			fill("white");
			//textWeight(100); 
			textSize(40);
			text(ceil(countdown), 300, 300);
		}
	}
}

//Draw the sky where all of your constelations are stored
function drawSky()
{

	for (let i = 0; i < min(constellations.length, 6); i++)
	{
		//draw them randomly
		drawConstellation(constellations[i].keypoints, randomArrayPoints[i][0], randomArrayPoints[i][1], .25, randomArrayPoints[i][2]);
	}
}

// Callback function for when bodyPose outputs data
function gotPoses(results)
{
	// Save the output to the poses variable
	poses = results;
}

//for buttons
function mouseClicked()
{
	if (mouseX > 80 && mouseX < 230 && mouseY > 530 && mouseY < 580)
	{
		scene = 1 - scene;

		//placing the constalations semi-randomly on a grid
		randomArrayPoints = []; 
		for (let x = 120; x < 600; x += 200)
		{
			for (let y = 120; y < 400; y += 240)
			{
				randomArrayPoints.push([x + random(-50, 50), y + random(-70, 70), random(-.78, .78)]);
			}
		}
		randomArrayPoints = shuffle(randomArrayPoints);
	}

	if (mouseX > 400 && mouseX < 550 && mouseY > 530 && mouseY < 580)
	{
		if (scene == 0)
		{
			countdown = 3;
		}
	}
}

//everytime you click back and forth between scenes the constelation will randomly shift somewhere on the screen
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));
    
    // Swap elements array[i] and array[j]
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

//some little flavor stars for background!
function drawStars()
{
	noStroke();
	for(let i of bgStars)
	{
		let twinkle = 0.7 + 0.3 * sin(frameCount * 0.03 + i.phase);
		fill(200, 220, 255, i.alpha * twinkle);
		circle(i.x, i.y, i.size);
	}
}