// Local-only helper: ask RimWorld to draw its own definition icons.
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml.Linq;
using RimWorld;
using UnityEngine;
using Verse;

namespace RimMaker.ResourceIcons
{
    [StaticConstructorOnStartup]
    public static class Startup
    {
        static Startup()
        {
            string output;
            if (!GenCommandLine.TryGetCommandLineArg("rimmaker-resource-icons", out output)) return;
            LongEventHandler.ExecuteWhenFinished(delegate {
                var host = new GameObject("RimMaker resource icon capture");
                UnityEngine.Object.DontDestroyOnLoad(host);
                host.AddComponent<IconCapture>().Initialize(output);
            });
        }
    }

    public sealed class IconCapture : MonoBehaviour
    {
        const int Size = 64, Columns = 8, BatchSize = 64;
        string output;
        List<ThingDef> definitions = new List<ThingDef>();
        XElement report;
        int batch;
        bool drawing, white;

        public void Initialize(string directory)
        {
            output = directory;
            try
            {
                RecipeChoicesChecks.Verify(output);
                report = new XElement("icons", new XAttribute("gameVersion", VersionControl.CurrentVersionString));
                foreach (var entry in XDocument.Load(Path.Combine(output, "resources.xml")).Root.Elements("resource"))
                {
                    string name = (string)entry.Attribute("defName");
                    ThingDef def = DefDatabase<ThingDef>.GetNamedSilentFail(name);
                    if (def == null || def.uiIcon == null || def.uiIcon == BaseContent.BadTex)
                        report.Add(new XElement("missing", new XAttribute("defName", name)));
                    else definitions.Add(def);
                }
                StartCoroutine(Capture());
            }
            catch (Exception error) { Fail(error); }
        }

        void OnGUI()
        {
            if (!drawing || Event.current.type != EventType.Repaint) return;
            int oldDepth = GUI.depth;
            Matrix4x4 oldMatrix = GUI.matrix;
            Color oldColor = GUI.color;
            try
            {
                GUI.depth = -100000;
                GUI.matrix = Matrix4x4.identity;
                GUI.color = white ? Color.white : Color.black;
                GUI.DrawTexture(new Rect(0, 0, Screen.width, Screen.height), Texture2D.whiteTexture);
                GUI.color = Color.white;
                for (int i = 0; i < BatchSize && batch + i < definitions.Count; i++)
                    Widgets.DefIcon(new Rect(i % Columns * Size + 4, i / Columns * Size + 4, Size - 8, Size - 8), definitions[batch + i]);
            }
            catch (Exception error) { Fail(error); }
            finally { GUI.depth = oldDepth; GUI.matrix = oldMatrix; GUI.color = oldColor; }
        }

        IEnumerator Capture()
        {
            // Two backgrounds preserve the game's shader, colour, angle and scale while recovering alpha.
            for (batch = 0; batch < definitions.Count; batch += BatchSize)
            {
                drawing = true; white = false;
                yield return null;
                yield return new WaitForEndOfFrame();
                Texture2D dark = ReadSheet();
                white = true;
                yield return null;
                yield return new WaitForEndOfFrame();
                Texture2D light = ReadSheet();
                try { SaveBatch(dark, light); }
                catch (Exception error) { Fail(error); yield break; }
                finally { UnityEngine.Object.Destroy(dark); UnityEngine.Object.Destroy(light); }
            }
            drawing = false;
            new XDocument(report).Save(Path.Combine(output, "icons.xml"));
            Application.Quit(0);
        }

        Texture2D ReadSheet()
        {
            var texture = new Texture2D(Columns * Size, Columns * Size, TextureFormat.RGB24, false);
            texture.ReadPixels(new Rect(0, Screen.height - Columns * Size, Columns * Size, Columns * Size), 0, 0);
            texture.Apply();
            return texture;
        }

        void SaveBatch(Texture2D dark, Texture2D light)
        {
            for (int i = 0; i < BatchSize && batch + i < definitions.Count; i++)
            {
                ThingDef def = definitions[batch + i];
                int x = i % Columns * Size, y = (Columns - 1 - i / Columns) * Size;
                Color[] blackPixels = dark.GetPixels(x, y, Size, Size), whitePixels = light.GetPixels(x, y, Size, Size);
                for (int p = 0; p < blackPixels.Length; p++)
                {
                    Color b = blackPixels[p], w = whitePixels[p];
                    float alpha = Mathf.Clamp01(1f - ((w.r - b.r) + (w.g - b.g) + (w.b - b.b)) / 3f);
                    blackPixels[p] = alpha < .01f ? Color.clear : new Color(Mathf.Clamp01(b.r / alpha), Mathf.Clamp01(b.g / alpha), Mathf.Clamp01(b.b / alpha), alpha);
                }
                var icon = new Texture2D(Size, Size, TextureFormat.RGBA32, false);
                icon.SetPixels(blackPixels); icon.Apply();
                File.WriteAllBytes(Path.Combine(output, def.defName + ".png"), icon.EncodeToPNG());
                UnityEngine.Object.Destroy(icon);
                report.Add(new XElement("icon", new XAttribute("defName", def.defName),
                    new XAttribute("texture", (string.IsNullOrEmpty(def.uiIconPath) ? (def.graphicData == null ? "" : def.graphicData.texPath) : def.uiIconPath) ?? ""),
                    new XAttribute("renderer", "Widgets.DefIcon")));
            }
        }

        void Fail(Exception error)
        {
            drawing = false;
            File.WriteAllText(Path.Combine(output, "capture-error.txt"), error.ToString());
            Log.Error(error.ToString());
            Application.Quit(1);
        }
    }
}
