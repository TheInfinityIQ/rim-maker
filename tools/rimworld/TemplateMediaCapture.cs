using System;
using System.Collections;
using System.IO;
using System.Xml.Linq;
using UnityEngine;
using Verse;
namespace RimMaker.TemplateMedia
{
    public sealed class PcmRecorder : MonoBehaviour
    {
        public readonly System.Collections.Generic.List<float> Samples = new System.Collections.Generic.List<float>();
        public int Channels;
        public bool Recording;
        void OnAudioFilterRead(float[] data, int channels) { if (Recording) lock (Samples) { Channels = channels; Samples.AddRange(data); } Array.Clear(data, 0, data.Length); }
    }
    [StaticConstructorOnStartup]
    public static class Startup
    {
        static Startup() { string output; if (!GenCommandLine.TryGetCommandLineArg("rimmaker-template-media", out output)) return; LongEventHandler.ExecuteWhenFinished(delegate { var host = new GameObject("RimMaker template media"); UnityEngine.Object.DontDestroyOnLoad(host); host.AddComponent<Capture>().Begin(output); }); }
    }
    public sealed class Capture : MonoBehaviour
    {
        string output;
        public void Begin(string path) { output = path; StartCoroutine(Run()); }
        IEnumerator Run()
        {
            foreach (XElement item in XDocument.Load(Path.Combine(output, "input.xml")).Root.Elements())
            {
                string id = (string)item.Attribute("id"), path = (string)item.Attribute("path");
                if (item.Name == "sound")
                {
                    AudioClip clip = ContentFinder<AudioClip>.Get(path);
                    clip.LoadAudioData();
                    int frames = 0; while (clip.loadState != AudioDataLoadState.Loaded && frames++ < 600) yield return null;
                    if (clip.loadState != AudioDataLoadState.Loaded) { File.WriteAllText(Path.Combine(output, "error.txt"), "Audio did not load: " + path); Application.Quit(1); yield break; }
                    var host = new GameObject("PCM decoder");
                    AudioSource source = host.AddComponent<AudioSource>(); source.clip = clip; source.spatialBlend = 0; source.priority = 0;
                    var recorder = host.AddComponent<PcmRecorder>();
                    AudioListener.volume = 1; recorder.Recording = true; source.Play();
                    yield return null; while (source.isPlaying) yield return null;
                    recorder.Recording = false;
                    float[] samples; lock (recorder.Samples) samples = recorder.Samples.ToArray();
                    int channels = recorder.Channels, frequency = AudioSettings.outputSampleRate;
                    if (samples.Length == 0 || channels == 0) { File.WriteAllText(Path.Combine(output, "error.txt"), "No decoded PCM: " + path); Application.Quit(1); yield break; }
                    UnityEngine.Object.Destroy(host);
                    using (var stream = File.Create(Path.Combine(output, id + ".wav"))) using (var writer = new BinaryWriter(stream))
                    {
                        writer.Write(System.Text.Encoding.ASCII.GetBytes("RIFF")); writer.Write(36 + samples.Length * 2); writer.Write(System.Text.Encoding.ASCII.GetBytes("WAVEfmt ")); writer.Write(16); writer.Write((short)1); writer.Write((short)channels); writer.Write(frequency); writer.Write(frequency * channels * 2); writer.Write((short)(channels * 2)); writer.Write((short)16); writer.Write(System.Text.Encoding.ASCII.GetBytes("data")); writer.Write(samples.Length * 2);
                        foreach (float sample in samples) writer.Write((short)Mathf.RoundToInt(Mathf.Clamp(sample, -1, 1) * 32767));
                    }
                }
                else
                {
                    Texture2D texture = ContentFinder<Texture2D>.Get(path);
                    if (texture == BaseContent.BadTex) { File.WriteAllText(Path.Combine(output, "error.txt"), "Texture unavailable: " + path); Application.Quit(1); yield break; }
                    RenderTexture render = RenderTexture.GetTemporary(texture.width, texture.height, 0, RenderTextureFormat.ARGB32);
                    Graphics.Blit(texture, render); RenderTexture.active = render;
                    var image = new Texture2D(texture.width, texture.height, TextureFormat.RGBA32, false); image.ReadPixels(new Rect(0, 0, texture.width, texture.height), 0, 0); image.Apply(); File.WriteAllBytes(Path.Combine(output, id + ".png"), image.EncodeToPNG()); RenderTexture.active = null; RenderTexture.ReleaseTemporary(render); UnityEngine.Object.Destroy(image);
                }
            }
            File.WriteAllText(Path.Combine(output, "complete.txt"), "Complete"); Application.Quit(0);
        }
    }
}
