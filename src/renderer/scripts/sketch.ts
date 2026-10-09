import p5 from "p5";

export const sketch = (p: p5): void => {
	/**
	 * Setup
	 */
	p.setup = (): void => {
		p.createCanvas(1000, 1000);
		//p.background(255);

		//p.colorMode( p.HSB,360,100,100);
		//p.background(0,100,100);

		p.colorMode(p.HSB,360,100,100);
		p.noStroke();
		for ( let i=0; i<500; i+=10) {
			p.fill((360.0/500)*i,80,100); //50分割
			p.rect(i,0,10,500);
		}
		
	};

	/**
	 * Draw
	 */
	p.draw = (): void => {
		p.beginShape();
		p.vertex( 250,50 );
		p.vertex( 100,450 );
		p.vertex( 450,200 );
		p.vertex( 50,200 );
		p.vertex( 400,450 );
		p.vertex( 250,50 );
		p.endShape();

		p.beginShape();
		p.vertex( 250,425 );
		p.vertex( 150,525 );
		p.vertex( 350,525 );
		p.vertex( 250,425 );
		p.endShape();

		//p.ellipse(100,600,100,100);
		p.circle(250,600,150);

		p.rect(130,675,240,130);

		p.rect(240,805,20,130);
	};

	/**
	 * Window Resized
	 */
	p.windowResized = (): void => {
		p.resizeCanvas(p.windowWidth, p.windowHeight);
	};

	/**
	 * パステルカラーでランダムな色を取得する
	 */
	const getRandomPastelColor = (p: p5): p5.Color => {
		let color: p5.Color;
		do {
			let r = p.random(200, 255);
			let g = p.random(200, 255);
			let b = p.random(200, 255);
			color = p.color(r, g, b);
		} while (p.saturation(color) < 40 || p.brightness(color) < 60); // 彩度が低いまたは明度が低い色を再抽選する条件
		return color;
	};
};
