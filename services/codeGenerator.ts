import { GuiElement, ElementType, ProjectSettings, McVersion, ModLoader, EventType, ActionType, EventAction } from '../types';

const getImports = (settings: ProjectSettings): string[] => {
  const common = [
    'net.minecraft.client.gui.screen.Screen',
  ];

  const isFabric = settings.loader === ModLoader.FABRIC || settings.loader === ModLoader.QUILT;
  const isLwjgl2 = settings.loader === ModLoader.LWJGL2;
  const version = settings.version;

  // Version Groupings
  const is120Plus = [McVersion.V1_20_4, McVersion.V1_21].includes(version);
  const isLegacy = [McVersion.V1_8_9, McVersion.V1_12_2].includes(version);

  if (isLwjgl2) {
    // Custom Client / LWJGL 2 imports
    const imports = [
      'net.minecraft.client.gui.GuiScreen',
      'net.minecraft.client.gui.GuiButton',
      'net.minecraft.client.gui.GuiTextField',
      'org.lwjgl.opengl.GL11',
      'java.awt.Color',
      'net.minecraft.util.ResourceLocation'
    ];
    if (version === McVersion.V1_12_2) {
      imports.push('net.minecraft.client.renderer.GlStateManager');
    }
    return imports;
  }

  // Standard Logic
  if (!isLegacy) {
    common.push('net.minecraft.text.Text'); // Text exists in modern
    common.push(
      'net.minecraft.client.gui.widget.ButtonWidget',
      'net.minecraft.client.gui.widget.TextFieldWidget',
      'net.minecraft.client.gui.widget.CheckboxWidget',
      'net.minecraft.client.gui.widget.SliderWidget',
      'net.minecraft.util.Identifier'
    );
    if (is120Plus) {
      common.push('net.minecraft.client.gui.DrawContext');
      common.push('net.minecraft.util.math.RotationAxis'); // For 1.20+ rotation
      common.push('net.minecraft.client.gui.screen.ingame.InventoryScreen');
      common.push('net.minecraft.item.Items');
      common.push('net.minecraft.item.ItemStack');
    } else {
      common.push(isFabric ? 'net.minecraft.client.util.math.MatrixStack' : 'com.mojang.blaze3d.vertex.PoseStack');
      common.push('com.mojang.blaze3d.systems.RenderSystem');
      // For 1.16-1.19 rotation often uses Vector3f or Quaternion
      common.push('net.minecraft.util.math.Vec3f');
    }
  } else {
    // Legacy
    common.push(
      'net.minecraft.client.gui.GuiScreen',
      'net.minecraft.client.gui.GuiButton',
      'net.minecraft.client.gui.GuiTextField',
      'net.minecraft.util.ResourceLocation'
    );
    if (version === McVersion.V1_8_9) {
      common.push('org.lwjgl.opengl.GL11');
    } else if (version === McVersion.V1_12_2) {
      common.push('net.minecraft.client.renderer.GlStateManager');
    }
  }

  if (isFabric) {
    common.push('net.fabricmc.api.EnvType', 'net.fabricmc.api.Environment');
  } else if (!isLwjgl2) {
    common.push('net.minecraftforge.api.distmarker.Dist', 'net.minecraftforge.api.distmarker.OnlyIn');
  }

  return common;
};

// Helper to calculate responsive position code
const getPosCode = (val: number, size: number, totalSize: number, isX: boolean, responsive: boolean): string => {
  if (!responsive) return `${Math.round(val)}`;
  const center = val + size / 2;
  const ratio = center / totalSize;
  if (ratio < 0.33) return `${Math.round(val)}`;
  else if (ratio > 0.66) {
    const offset = totalSize - val;
    return `this.${isX ? 'width' : 'height'} - ${Math.round(offset)}`;
  } else {
    const offset = val - (totalSize / 2);
    const sign = offset >= 0 ? '+' : '-';
    return `this.${isX ? 'width' : 'height'} / 2 ${sign} ${Math.abs(Math.round(offset))}`;
  }
};

const hexToInt = (colorStr?: string, opacity: number = 1) => {
  const hex = colorStr ? parseInt(colorStr.replace('#', ''), 16) : 0xFFFFFF;
  const alpha = Math.floor(opacity * 255);
  return (alpha << 24) | hex;
};

// --- Generator Functions for Advanced Effects ---

const generateGradientCode = (el: GuiElement, x: string, y: string, w: string, h: string, isLwjgl2: boolean, is120Plus: boolean) => {
  if (!el.gradient?.enabled) return '';

  const startColor = hexToInt(el.gradient.startColor, el.opacity);
  const endColor = hexToInt(el.gradient.endColor, el.opacity);

  // LWJGL 2 Gradient (Manual Quads)
  if (isLwjgl2) {
    // Assuming vertical gradient for simplicity in legacy
    return `        drawGradientRect(${x}, ${y}, ${w}, ${h}, ${startColor}, ${endColor});`;
  }

  // Modern Gradient
  if (is120Plus) {
    return `        context.fillGradient(${x}, ${y}, ${w}, ${h}, ${startColor}, ${endColor});`;
  } else {
    return `        fillGradient(matrices, ${x}, ${y}, ${w}, ${h}, ${startColor}, ${endColor});`;
  }
};

const generateShadowCode = (el: GuiElement, x: string, y: string, w: string, h: string, isLwjgl2: boolean, is120Plus: boolean) => {
  if (!el.shadow?.enabled) return '';

  const sColor = hexToInt(el.shadow.color, 0.5); // Simplified opacity
  const xOff = el.shadow.xOffset;
  const yOff = el.shadow.yOffset;

  // Shadow is just a rect behind
  if (isLwjgl2) {
    return `        drawRect(${x} + ${xOff}, ${y} + ${yOff}, ${w} + ${xOff}, ${h} + ${yOff}, ${sColor}); // Shadow`;
  }
  if (is120Plus) {
    return `        context.fill(${x} + ${xOff}, ${y} + ${yOff}, ${w} + ${xOff}, ${h} + ${yOff}, ${sColor});`;
  }
  return `        fill(matrices, ${x} + ${xOff}, ${y} + ${yOff}, ${w} + ${xOff}, ${h} + ${yOff}, ${sColor});`;
};

// ... Border code remains same ...
const generateBorderCode = (
  el: GuiElement, settings: ProjectSettings, ctxVar: string, isLegacy: boolean, isLwjgl2: boolean, is120Plus: boolean
) => {
  if (!el.borderWidth || el.borderWidth <= 0) return '';
  const bColor = hexToInt(el.borderColor, 1.0);
  const thick = el.borderWidth;

  const rects = [
    { x: el.x, y: el.y, w: el.width, h: thick },
    { x: el.x, y: el.y + el.height - thick, w: el.width, h: thick },
    { x: el.x, y: el.y, w: thick, h: el.height },
    { x: el.x + el.width - thick, y: el.y, w: thick, h: el.height },
  ];

  const lines = rects.map(r => {
    const x = getPosCode(r.x, r.w, settings.screenWidth, true, settings.responsive);
    const y = getPosCode(r.y, r.h, settings.screenHeight, false, settings.responsive);
    const x2 = settings.responsive ? `(${x} + ${r.w})` : `${r.x + r.w}`;
    const y2 = settings.responsive ? `(${y} + ${r.h})` : `${r.y + r.h}`;

    if (isLwjgl2) return `        drawRect(${x}, ${y}, ${x2}, ${y2}, ${bColor});`;
    if (isLegacy) return `        drawRect(${x}, ${y}, ${x2}, ${y2}, ${bColor});`;
    if (is120Plus) return `        context.fill(${x}, ${y}, ${x2}, ${y2}, ${bColor});`;
    return `        fill(matrices, ${x}, ${y}, ${x2}, ${y2}, ${bColor});`;
  });
  return `        // Border\n` + lines.join('\n') + '\n';
};

// Helper for Rotation
const generateRotationStart = (el: GuiElement, xCode: string, yCode: string, wCode: string, hCode: string, isLwjgl2: boolean, is120Plus: boolean) => {
  if (!el.rotation || el.rotation === 0) return '';

  // Calculate center
  const cx = `${xCode} + ${el.width}/2`;
  const cy = `${yCode} + ${el.height}/2`;

  if (isLwjgl2) {
    return `        GL11.glPushMatrix();
        GL11.glTranslatef(${cx}, ${cy}, 0);
        GL11.glRotatef(${el.rotation}f, 0, 0, 1);
        GL11.glTranslatef(-(${cx}), -(${cy}), 0);`;
  }

  if (is120Plus) {
    return `        context.getMatrices().push();
        context.getMatrices().translate(${cx}, ${cy}, 0);
        context.getMatrices().multiply(RotationAxis.POSITIVE_Z.rotationDegrees(${el.rotation}f));
        context.getMatrices().translate(-(${cx}), -(${cy}), 0);`;
  }

  // 1.16-1.19
  return `        matrices.push();
        matrices.translate(${cx}, ${cy}, 0);
        matrices.multiply(Vec3f.POSITIVE_Z.getDegreesQuaternion(${el.rotation}f));
        matrices.translate(-(${cx}), -(${cy}), 0);`;
};

const generateRotationEnd = (el: GuiElement, isLwjgl2: boolean, is120Plus: boolean) => {
  if (!el.rotation || el.rotation === 0) return '';
  if (isLwjgl2) return `        GL11.glPopMatrix();`;
  if (is120Plus) return `        context.getMatrices().pop();`;
  return `        matrices.pop();`;
};

const generateEventCode = (action: EventAction, isFabric: boolean, is120Plus: boolean, screens?: Array<{ id: string; settings: { className: string } }>): string => {
  if (!action || !action.type) return '';

  let code = '';
  switch (action.type) {
    case ActionType.OPEN_SCREEN:
      // Map screen ID to class name
      const targetScreen = screens?.find(s => s.id === action.value);
      const screenClassName = targetScreen?.settings.className || action.value;
      code = `MinecraftClient.getInstance().setScreen(new ${screenClassName}());`;
      break;
    case ActionType.EXECUTE_COMMAND:
      // Remove leading slash if present
      const cmd = action.value.startsWith('/') ? action.value.substring(1) : action.value;
      code = `MinecraftClient.getInstance().player.networkHandler.sendChatCommand("${cmd}");`;
      break;
    case ActionType.PLAY_SOUND:
      code = `MinecraftClient.getInstance().getSoundManager().play(PositionedSoundInstance.master(SoundEvents.${action.value.toUpperCase().replace(/\./g, '_')}, 1.0f));`;
      break;
    case ActionType.CUSTOM_CODE:
      code = action.value;
      break;
  }
  return code;
};

export const generateJavaCode = (elements: GuiElement[], settings: ProjectSettings, screens?: Array<{ id: string; settings: { className: string } }>): string => {
  const isFabric = settings.loader === ModLoader.FABRIC || settings.loader === ModLoader.QUILT;
  const isLwjgl2 = settings.loader === ModLoader.LWJGL2;
  const version = settings.version;
  const isLegacy = [McVersion.V1_8_9, McVersion.V1_12_2].includes(version);
  const is120Plus = [McVersion.V1_20_4, McVersion.V1_21].includes(version);

  const imports = getImports(settings);

  let annotation = '';
  if (isFabric) annotation = '@Environment(EnvType.CLIENT)';
  else if (!isLwjgl2) annotation = '@OnlyIn(Dist.CLIENT)';

  const parentClass = (isLegacy || isLwjgl2) ? 'GuiScreen' : 'Screen';

  let constructor = '';
  if (isLegacy || isLwjgl2) {
    constructor = `    public ${settings.className}() { super(); }`;
  } else {
    constructor = `    public ${settings.className}() { super(Text.literal("Title")); }`;
  }

  const classDecl = `${annotation ? annotation + '\n' : ''}public class ${settings.className} extends ${parentClass} {`;

  // Fields ... (Same)
  const fields = elements.map(el => {
    if (isLegacy || isLwjgl2) {
      if (el.type === ElementType.TEXT_FIELD) return `    private GuiTextField ${el.variableName};`;
      if (el.type === ElementType.BUTTON) return `    private GuiButton ${el.variableName};`;
      return null;
    }
    switch (el.type) {
      case ElementType.TEXT_FIELD: return `    private TextFieldWidget ${el.variableName};`;
      case ElementType.CHECKBOX: return `    private CheckboxWidget ${el.variableName};`;
      case ElementType.SLIDER: return `    private SliderWidget ${el.variableName};`;
      default: return null;
    }
  }).filter(Boolean).join('\n');

  // Init ... (Same)
  const initSignature = (isLegacy || isLwjgl2) ? 'public void initGui()' : 'protected void init()';
  const superInit = (isLegacy || isLwjgl2) ? 'super.initGui();' : 'super.init();';

  const initBody = elements.map(el => {
    const xCode = getPosCode(el.x, el.width, settings.screenWidth, true, settings.responsive);
    const yCode = getPosCode(el.y, el.height, settings.screenHeight, false, settings.responsive);

    if (isLegacy || isLwjgl2) {
      if (el.type === ElementType.BUTTON) return `        this.buttonList.add(this.${el.variableName} = new GuiButton(0, ${xCode}, ${yCode}, ${el.width}, ${el.height}, "${el.label}"));`;
      if (el.type === ElementType.TEXT_FIELD) {
        const fontRenderer = version === McVersion.V1_12_2 ? 'this.fontRenderer' : 'this.fontRendererObj';
        return `        this.${el.variableName} = new GuiTextField(0, ${fontRenderer}, ${xCode}, ${yCode}, ${el.width}, ${el.height});
        this.${el.variableName}.setText("${el.label || ''}");`;
      }
      return '';
    }
    switch (el.type) {
      case ElementType.BUTTON:
        const onClickAction = el.events?.[EventType.ON_CLICK];
        const onClickCode = onClickAction ? generateEventCode(onClickAction, isFabric, is120Plus, screens) : '';
        return `        this.addDrawableChild(ButtonWidget.builder(Text.literal("${el.label}"), button -> {
            ${onClickCode}
        }).dimensions(${xCode}, ${yCode}, ${el.width}, ${el.height}).build());`;
      case ElementType.TEXT_FIELD:
        return `        this.${el.variableName} = new TextFieldWidget(this.textRenderer, ${xCode}, ${yCode}, ${el.width}, ${el.height}, Text.literal("${el.label || ''}"));
        this.addDrawableChild(this.${el.variableName});`;
      case ElementType.CHECKBOX:
        return `        this.${el.variableName} = CheckboxWidget.builder(Text.literal("${el.label}"), this.textRenderer).pos(${xCode}, ${yCode}).checked(${el.checked}).build();
        this.addDrawableChild(this.${el.variableName});`;
      case ElementType.SLIDER:
        return `        this.${el.variableName} = new SliderWidget(${xCode}, ${yCode}, ${el.width}, ${el.height}, Text.literal("${el.label}"), 0.5) {
            @Override protected void updateMessage() { this.setMessage(Text.literal("${el.label}: " + this.value)); }
            @Override protected void applyValue() {}
        };
        this.addDrawableChild(this.${el.variableName});`;
      default: return '';
    }
  }).filter(s => s).join('\n');

  const initMethod = `    @Override
    ${initSignature} {
        ${superInit}
${initBody}
    }`;

  // Render ...
  let renderSig = '';
  let ctxVar = 'matrices';
  if (is120Plus) { renderSig = 'public void render(DrawContext context, int mouseX, int mouseY, float delta)'; ctxVar = 'context'; }
  else if (isLegacy || isLwjgl2) { renderSig = 'public void drawScreen(int mouseX, int mouseY, float partialTicks)'; ctxVar = ''; }
  else { const stackType = isFabric ? 'MatrixStack' : 'PoseStack'; renderSig = `public void render(${stackType} matrices, int mouseX, int mouseY, float delta)`; }

  const superRender = (isLegacy || isLwjgl2) ? 'super.drawScreen(mouseX, mouseY, partialTicks);' : `super.render(${ctxVar}, mouseX, mouseY, delta);`;

  const renderBody = elements.map((el) => {
    const color = hexToInt(el.color, el.opacity);
    const hex = el.color ? parseInt(el.color.replace('#', ''), 16) : 0xFFFFFF;
    const xCode = getPosCode(el.x, el.width, settings.screenWidth, true, settings.responsive);
    const yCode = getPosCode(el.y, el.height, settings.screenHeight, false, settings.responsive);
    const wCode = settings.responsive ? `(${xCode} + ${el.width})` : `${el.x + el.width}`;
    const hCode = settings.responsive ? `(${yCode} + ${el.height})` : `${el.y + el.height}`;

    let codeBlock = '';

    // Wrap in rotation if needed
    codeBlock += generateRotationStart(el, xCode, yCode, wCode, hCode, isLwjgl2, is120Plus);

    // Advanced Effects Pre-render (Shadow)
    codeBlock += generateShadowCode(el, xCode, yCode, wCode, hCode, isLwjgl2, is120Plus);

    // Hover
    if (!isLegacy && !isLwjgl2 && el.hover?.enabled) {
      codeBlock += `        if (this.isMouseOver(mouseX, mouseY)) {\n`;
      codeBlock += `            // Hover Animation: ${el.hover.type} (Duration: ${el.hover.duration}s)\n`;

      switch (el.hover.type) {
        case 'SCALE':
          codeBlock += `            // Scale factor: ${el.hover.scale}\n`;
          codeBlock += `            // Logic: matrices.scale(${el.hover.scale}f, ${el.hover.scale}f, 1f);\n`;
          break;
        case 'LIFT':
          codeBlock += `            // Lift amount: -${el.hover.liftAmount}px\n`;
          codeBlock += `            matrices.translate(0, -${el.hover.liftAmount}, 0);\n`;
          break;
        case 'SLIDE_RIGHT':
          codeBlock += `            // Slide amount: +${el.hover.slideAmount}px\n`;
          codeBlock += `            matrices.translate(${el.hover.slideAmount}, 0, 0);\n`;
          break;
        case 'GLOW':
          codeBlock += `            // Glow: ${el.hover.glowColor} with blur ${el.hover.glowBlur}\n`;
          break;
        case 'BORDER_PULSE':
          codeBlock += `            // Pulse Border: ${el.hover.glowColor}\n`;
          break;
      }

      if (el.hover.brightness && el.hover.brightness !== 1) {
        codeBlock += `            // Brightness boost: ${el.hover.brightness}x\n`;
      }

      codeBlock += `        }\n`;
    }

    // Backdrop Blur Comment
    if (el.backdropBlur && el.backdropBlur > 0) {
      codeBlock += `        // Note: Backdrop blur (${el.backdropBlur}px) requires a custom shader or applying a blur shader to the background texture.\n`;
    }

    // Render Body
    const useLegacyRender = isLegacy || isLwjgl2;
    if (el.type === ElementType.PANEL || el.type === ElementType.SLOT || (el.type === ElementType.BUTTON && el.gradient?.enabled)) {
      // (Gradient logic reuse omitted, assuming simple fill for rotation update context)
      if (el.gradient?.enabled) {
        codeBlock += generateGradientCode(el, xCode, yCode, wCode, hCode, isLwjgl2, is120Plus);
      } else {
        if (useLegacyRender) {
          codeBlock += `        drawRect(${xCode}, ${yCode}, ${wCode}, ${hCode}, ${color});\n`;
        } else {
          if (is120Plus) codeBlock += `        context.fill(${xCode}, ${yCode}, ${wCode}, ${hCode}, ${color});\n`;
          else codeBlock += `        fill(matrices, ${xCode}, ${yCode}, ${wCode}, ${hCode}, ${color});\n`;
        }
      }
    } else if (el.type === ElementType.LABEL) {
      let xPos = xCode;
      if (el.textAlign === 'center') xPos = settings.responsive ? `(${xCode} + ${el.width} / 2) - ...` : `${el.x + el.width / 2} - ...`;
      if (useLegacyRender) {
        const fr = version === McVersion.V1_12_2 ? 'this.fontRenderer' : 'this.fontRendererObj';
        codeBlock += `        ${fr}.drawString("${el.label}", ${xPos}, ${yCode}, ${hex});\n`;
      } else {
        if (is120Plus) codeBlock += `        context.drawText(this.textRenderer, "${el.label}", ${xPos}, ${yCode}, ${hex}, ${el.textShadow !== false});\n`;
        else codeBlock += `        drawText(matrices, this.textRenderer, "${el.label}", ${xPos}, ${yCode}, ${hex});\n`;
      }
    } else if (el.type === ElementType.ENTITY) {
      codeBlock += `        // Entity: ${el.entityType}\n`;
      if (is120Plus) {
        codeBlock += `        InventoryScreen.drawEntity(context, ${xCode} + ${el.width}/2, ${yCode} + ${el.height} - 5, ${Math.min(el.width, el.height) / 2}, 0, 0, null); // Placeholder for entity instance\n`;
      } else {
        codeBlock += `        // InventoryScreen.drawEntity(${xCode} + ${el.width}/2, ${yCode} + ${el.height} - 5, ${Math.min(el.width, el.height) / 2}, 0, 0, null);\n`;
      }
    } else if (el.type === ElementType.ITEM) {
      codeBlock += `        // Item: ${el.itemId}\n`;
      if (is120Plus) {
        codeBlock += `        context.drawItem(new ItemStack(Items.${(el.itemId || 'stone').toUpperCase()}), ${xCode}, ${yCode});\n`;
      } else {
        codeBlock += `        this.itemRenderer.renderItemAndEffectIntoGUI(new ItemStack(Items.${(el.itemId || 'stone').toUpperCase()}), ${xCode}, ${yCode});\n`;
      }
    } else if (el.type === ElementType.PROGRESS_BAR) {
      const progress = Math.min(100, Math.max(0, el.progress || 0));
      const barWidth = settings.responsive ? `(int)((${wCode} - ${xCode}) * ${progress / 100.0})` : Math.round(el.width * (progress / 100.0));

      // Background
      if (is120Plus) codeBlock += `        context.fill(${xCode}, ${yCode}, ${wCode}, ${hCode}, 0xFF555555);\n`;
      else codeBlock += `        fill(matrices, ${xCode}, ${yCode}, ${wCode}, ${hCode}, 0xFF555555);\n`;

      // Foreground
      if (is120Plus) codeBlock += `        context.fill(${xCode}, ${yCode}, ${xCode} + ${barWidth}, ${hCode}, ${color});\n`;
      else codeBlock += `        fill(matrices, ${xCode}, ${yCode}, ${xCode} + ${barWidth}, ${hCode}, ${color});\n`;
    } else if (el.type === ElementType.SCROLL_PANEL) {
      codeBlock += `        // Scroll Panel (Scissor)\n`;
      if (is120Plus) {
        codeBlock += `        context.enableScissor(${xCode}, ${yCode}, ${xCode} + ${el.width}, ${yCode} + ${el.height});\n`;
        codeBlock += `        // Render content here...\n`;
        codeBlock += `        context.disableScissor();\n`;
      } else {
        codeBlock += `        // GL11.glEnable(GL11.GL_SCISSOR_TEST);\n`;
        codeBlock += `        // Render content here...\n`;
        codeBlock += `        // GL11.glDisable(GL11.GL_SCISSOR_TEST);\n`;
      }
    } else if (el.type === ElementType.DROPDOWN) {
      codeBlock += `        // Dropdown: ${el.label}\n`;
      // Render logic similar to button but with arrow
      if (is120Plus) {
        codeBlock += `        context.fill(${xCode}, ${yCode}, ${wCode}, ${hCode}, 0xFF000000);\n`;
        codeBlock += `        context.drawText(this.textRenderer, "${el.label}", ${xCode} + 4, ${yCode} + 6, 0xFFFFFF, false);\n`;
      } else {
        codeBlock += `        fill(matrices, ${xCode}, ${yCode}, ${wCode}, ${hCode}, 0xFF000000);\n`;
        codeBlock += `        drawString(matrices, this.textRenderer, "${el.label}", ${xCode} + 4, ${yCode} + 6, 0xFFFFFF);\n`;
      }
    }

    // Tooltip Logic
    if (el.tooltip) {
      codeBlock += `        if (mouseX >= ${xCode} && mouseX <= ${wCode} && mouseY >= ${yCode} && mouseY <= ${hCode}) {\n`;
      if (is120Plus) {
        codeBlock += `            context.drawTooltip(this.textRenderer, Text.literal("${el.tooltip}"), mouseX, mouseY);\n`;
      } else if (!isLegacy && !isLwjgl2) {
        codeBlock += `            this.renderTooltip(matrices, Text.literal("${el.tooltip}"), mouseX, mouseY);\n`;
      } else {
        codeBlock += `            this.drawHoveringText(java.util.Collections.singletonList("${el.tooltip}"), mouseX, mouseY);\n`;
      }
      codeBlock += `        }\n`;
    }

    codeBlock += generateBorderCode(el, settings, ctxVar, isLegacy, isLwjgl2, is120Plus);
    codeBlock += generateRotationEnd(el, isLwjgl2, is120Plus);

    return codeBlock;
  }).filter(s => s).join('\n');

  const renderMethod = `    @Override
    ${renderSig} {
        this.renderBackground(${ctxVar});
        ${superRender}
${renderBody}
    }`;

  return [
    imports.map(i => `import ${i};`).join('\n'),
    '',
    classDecl,
    fields ? '\n' + fields : '',
    '',
    constructor,
    '',
    initMethod,
    '',
    renderMethod,
    '}'
  ].join('\n');
};
