async function run() {
  const { YoutubeTranscript } = await import('youtube-transcript');
  console.log("Success YT import");
  
  const cheerio = await import('cheerio');
  console.log("Success cheerio:", cheerio.load);
}
run();
