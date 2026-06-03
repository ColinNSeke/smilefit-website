// Velocity compute shader — ported from three.js webgl_gpgpu_birds,
// with a 4th force: attraction toward a per-bird target ("SmileFit"
// formation), weighted by scroll-driven targetWeight.
uniform float time;
uniform float testing;
uniform float delta;
uniform float separationDistance;
uniform float alignmentDistance;
uniform float cohesionDistance;
uniform float freedomFactor;
uniform vec3  predator;
uniform float targetWeight;     // 0 = free flocking, 1 = fully formed

const float PI = 3.141592653589793;
const float PI_2 = PI * 2.0;

const float UPPER_BOUNDS = BOUNDS;
const float LOWER_BOUNDS = -UPPER_BOUNDS;
const float SPEED_LIMIT = 9.0;

void main() {
  float zoneRadius = separationDistance + alignmentDistance + cohesionDistance;
  float separationThresh = separationDistance / zoneRadius;
  float alignmentThresh = ( separationDistance + alignmentDistance ) / zoneRadius;
  float zoneRadiusSquared = zoneRadius * zoneRadius;

  float width = resolution.x;
  float height = resolution.y;

  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 birdPosition, birdVelocity;

  vec3 selfPosition = texture2D( texturePosition, uv ).xyz;
  vec3 selfVelocity = texture2D( textureVelocity, uv ).xyz;

  float dist;
  vec3 dir;
  float distSquared;
  float f;
  float percent;

  vec3 velocity = selfVelocity;
  float limit = SPEED_LIMIT;

  // predator (cursor) repulsion
  dir = predator * UPPER_BOUNDS - selfPosition;
  dir.z = 0.;
  dist = length( dir );
  distSquared = dist * dist;
  float preyRadius = 150.0;
  float preyRadiusSq = preyRadius * preyRadius;
  if ( dist < preyRadius ) {
    f = ( distSquared / preyRadiusSq - 1.0 ) * delta * 100.;
    velocity += normalize( dir ) * f;
    limit += 5.0;
  }

  // attract flocks to the center
  vec3 central = vec3( 0., 0., 0. );
  dir = selfPosition - central;
  dir.y *= 2.5;
  velocity -= normalize( dir ) * delta * 5. * ( 1.0 - targetWeight );

  // boids: separation / alignment / cohesion
  for ( float y = 0.0; y < height; y++ ) {
    for ( float x = 0.0; x < width; x++ ) {
      vec2 ref = vec2( x + 0.5, y + 0.5 ) / resolution.xy;
      birdPosition = texture2D( texturePosition, ref ).xyz;
      dir = birdPosition - selfPosition;
      dist = length( dir );
      if ( dist < 0.0001 ) continue;
      distSquared = dist * dist;
      if ( distSquared > zoneRadiusSquared ) continue;
      percent = distSquared / zoneRadiusSquared;

      if ( percent < separationThresh ) {
        f = ( separationThresh / percent - 1.0 ) * delta;
        velocity -= normalize( dir ) * f;
      } else if ( percent < alignmentThresh ) {
        float threshDelta = alignmentThresh - separationThresh;
        float adjustedPercent = ( percent - separationThresh ) / threshDelta;
        birdVelocity = texture2D( textureVelocity, ref ).xyz;
        f = ( 0.5 - cos( adjustedPercent * PI_2 ) * 0.5 + 0.5 ) * delta;
        velocity += normalize( birdVelocity ) * f;
      } else {
        float threshDelta = 1.0 - alignmentThresh;
        float adjustedPercent = threshDelta == 0. ? 1. : ( percent - alignmentThresh ) / threshDelta;
        f = ( 0.5 - ( cos( adjustedPercent * PI_2 ) * -0.5 + 0.5 ) ) * delta;
        velocity += normalize( dir ) * f;
      }
    }
  }

  // 4th force — attraction toward the "SmileFit" target point
  vec3 targetPos = texture2D( textureTarget, uv ).xyz;
  vec3 toTarget = targetPos - selfPosition;
  float tdist = length( toTarget );
  if ( tdist > 0.0001 ) {
    vec3 attractionForce = normalize( toTarget ) * targetWeight * smoothstep( 0.0, 30.0, tdist );
    velocity += attractionForce * 14.0;
    // settle precisely when formed & close
    if ( tdist < 6.0 ) velocity *= ( 1.0 - 0.6 * targetWeight );
  }

  if ( length( velocity ) > limit ) {
    velocity = normalize( velocity ) * limit;
  }

  gl_FragColor = vec4( velocity, 1.0 );
}
