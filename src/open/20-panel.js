/*
 * 小红书AI自动获客助手 —— 开源模块：浮动控制面板
 * 本文件属于项目的开源部分，基于 MIT 协议发布。
 * 提供页面内设置面板：表单、校验、拖动折叠、进度展示。
 */

const panel = (() => {
  let root, bodyEl, statusEl, progressEl;
  const els = {};
  const DEFAULT_PROMPT = '你是一个友善的小红书用户，请根据帖子内容和用户评论给出恰当的回复，回复要简短有趣。';
  const ACCENT = '#ff2442';

  const CSS = `
    #xhscap-root { position: fixed; top: 80px; right: 12px; width: 330px; max-height: 82vh;
      background: #fff; border-radius: 10px; box-shadow: 0 4px 24px rgba(0,0,0,.18);
      z-index: 2147483646; font-size: 12px; color: #333; font-family: system-ui, sans-serif; }
    #xhscap-root * { box-sizing: border-box; }
    #xhscap-header { display: flex; align-items: center; justify-content: space-between;
      padding: 10px 12px; background: linear-gradient(90deg,#ff2442,#ff5f7e); color: #fff;
      border-radius: 10px 10px 0 0; cursor: move; user-select: none; font-weight: 600; }
    #xhscap-body { padding: 10px 12px; overflow-y: auto; max-height: calc(82vh - 42px); }
    #xhscap-body.hidden { display: none; }
    .xhscap-group { border: 1px solid #eee; border-radius: 6px; padding: 8px; margin-bottom: 8px; }
    .xhscap-group > .xhscap-group-title { font-weight: 600; margin-bottom: 6px; color: ${ACCENT}; }
    .xhscap-row { display: flex; gap: 6px; margin-bottom: 6px; }
    .xhscap-row > * { flex: 1; }
    .xhscap-field { margin-bottom: 6px; }
    .xhscap-field label { display: block; margin-bottom: 2px; color: #666; }
    .xhscap-check { display: flex; align-items: center; gap: 4px; margin-right: 8px; }
    #xhscap-root .xhscap-check input {
      width: 14px; height: 14px; min-width: 14px; flex: 0 0 auto;
      padding: 0; margin: 0 4px 0 0; cursor: pointer;
      -webkit-appearance: checkbox; appearance: auto; accent-color: ${ACCENT};
    }
    #xhscap-root input, #xhscap-root select, #xhscap-root textarea {
      width: 100%; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px;
      font-size: 12px; font-family: inherit; }
    #xhscap-root textarea { resize: vertical; min-height: 40px; }
    #xhscap-status { padding: 6px 8px; border-radius: 4px; background: #f5f5f5; margin-bottom: 8px;
      min-height: 18px; word-break: break-all; }
    #xhscap-status.success { background: #e8f5e9; color: #2e7d32; }
    #xhscap-status.error { background: #ffebee; color: #c62828; }
    .xhscap-btns { display: flex; gap: 6px; margin-bottom: 8px; }
    .xhscap-btns button { flex: 1; padding: 6px 0; border: none; border-radius: 4px;
      color: #fff; cursor: pointer; font-size: 12px; }
    #xhscap-start { background: ${ACCENT}; }
    #xhscap-stop { background: #9e9e9e; }
    #xhscap-save { background: #2196f3; }
    #xhscap-progress { display: none; border: 1px solid #eee; border-radius: 6px; padding: 8px; }
    #xhscap-progress .xhscap-prow { display: flex; justify-content: space-between; margin-bottom: 3px; color: #555; }
    #xhscap-bar-wrap { background: #eee; border-radius: 4px; height: 8px; overflow: hidden; margin-top: 4px; }
    #xhscap-bar { height: 100%; width: 0%; background: #2196f3; transition: width .3s; }
    #xhscap-fab { position: fixed; right: 12px; top: 80px; width: 40px; height: 40px; border-radius: 50%;
      background: ${ACCENT}; color: #fff; border: none; cursor: pointer; z-index: 2147483646;
      font-size: 18px; box-shadow: 0 2px 10px rgba(0,0,0,.25); display: none; }
  `;

  const HTML = `
    <div id="xhscap-header"><span>📕 小红书AI自动获客助手</span><span id="xhscap-toggle">－</span></div>
    <div id="xhscap-body">
      <div id="xhscap-status"></div>
      <div class="xhscap-btns">
        <button id="xhscap-start">开始任务</button>
        <button id="xhscap-stop">停止任务</button>
        <button id="xhscap-save">保存配置</button>
      </div>
      <div class="xhscap-group">
        <div class="xhscap-group-title">任务设置</div>
        <div class="xhscap-field"><label>搜索关键词（英文逗号分隔）</label>
          <textarea id="xhscap-keywords" placeholder="关键词1,关键词2"></textarea></div>
        <div class="xhscap-row">
          <div class="xhscap-field"><label>帖子类型</label>
            <select id="xhscap-postType"><option value="all">全部</option><option value="image">图文</option><option value="video">视频</option></select></div>
          <div class="xhscap-field"><label>每关键词帖子数</label><input type="number" id="xhscap-videosPerKeyword" value="2" min="1"></div>
        </div>
        <div class="xhscap-field" style="margin-bottom:0"><label>筛选条件（留空/不限则不筛选）</label>
          <div class="xhscap-row">
            <div class="xhscap-field"><label>排序依据</label>
              <select id="xhscap-sort"><option value="">不筛选</option><option>综合</option><option>最新</option><option>最多点赞</option><option>最多评论</option><option>最多收藏</option></select></div>
            <div class="xhscap-field"><label>笔记类型</label>
              <select id="xhscap-noteType"><option value="">不筛选</option><option>视频</option><option>图文</option></select></div>
          </div>
          <div class="xhscap-row">
            <div class="xhscap-field"><label>发布时间</label>
              <select id="xhscap-time"><option value="">不筛选</option><option>一天内</option><option>一周内</option><option>半年内</option></select></div>
            <div class="xhscap-field"><label>搜索范围</label>
              <select id="xhscap-range"><option value="">不筛选</option><option>已看过</option><option>未看过</option><option>已关注</option></select></div>
            <div class="xhscap-field"><label>位置距离</label>
              <select id="xhscap-location"><option value="">不筛选</option><option>同城</option><option>附近</option></select></div>
          </div>
        </div>
      </div>
      <div class="xhscap-group">
        <div class="xhscap-group-title">操作与评论</div>
        <div class="xhscap-row" style="margin-bottom:6px">
          <label class="xhscap-check"><input type="checkbox" id="xhscap-likeBeforeComment"> 评论前点赞</label>
          <label class="xhscap-check"><input type="checkbox" id="xhscap-collectBeforeComment"> 评论前收藏</label>
        </div>
        <div class="xhscap-row">
          <div class="xhscap-field"><label>评论方式</label>
            <select id="xhscap-commentMode"><option value="reply">追评模式（回复他人评论）</option><option value="direct">直评模式（直接评论帖子）</option></select></div>
          <div class="xhscap-field"><label>评论类型</label>
            <select id="xhscap-commentType"><option value="emoji">仅表情回复</option><option value="text">文本回复</option><option value="ai">AI回复</option></select></div>
        </div>
        <div class="xhscap-field" id="xhscap-text-group"><label>评论文本内容（多条评论用换行分隔）</label>
          <textarea id="xhscap-comments" placeholder="每行一条评论内容"></textarea></div>
        <div id="xhscap-ai-group" style="display:none">
          <div class="xhscap-row">
            <div class="xhscap-field"><label>AI 模型</label>
              <select id="xhscap-aiModel">
                <option value="deepseek">DeepSeek</option><option value="kimi">Kimi</option>
                <option value="openai">OpenAI (GPT)</option><option value="openrouter">OpenRouter</option>
                <option value="xiaomimimo">小米 MiMo</option><option value="ollama">Ollama</option>
                <option value="gemini">Gemini</option>
              </select></div>
            <div class="xhscap-field"><label>API Key</label>
              <input type="password" id="xhscap-apiKey" placeholder="请输入API Key"></div>
          </div>
          <div class="xhscap-field" id="xhscap-baseUrl-group" style="display:none"><label>自定义接口地址（Ollama）</label>
            <input type="text" id="xhscap-aiBaseUrl" placeholder="例如：http://127.0.0.1:11434/v1/chat/completions"></div>
          <div class="xhscap-field" id="xhscap-customModel-group" style="display:none"><label>自定义模型名（Ollama）</label>
            <input type="text" id="xhscap-aiCustomModel" placeholder="例如：qwen2.5:7b"></div>
          <div class="xhscap-field" style="margin-bottom:0"><label>AI回复提示词</label>
            <textarea id="xhscap-aiPrompt"></textarea></div>
        </div>
        <div class="xhscap-row">
          <div class="xhscap-field"><label>每个帖子评论数量</label><input type="number" id="xhscap-commentsPerVideo" value="3" min="1"></div>
          <div class="xhscap-field"><label>每条评论时间间隔(秒)</label><input type="number" id="xhscap-commentInterval" value="3" min="0"></div>
        </div>
        <div id="xhscap-reply-filter-group">
          <div class="xhscap-field" style="margin-bottom:0"><label>评论内容包含（满足任意一个即可，英文逗号分隔）</label>
            <input type="text" id="xhscap-includeKeywords"></div>
          <div class="xhscap-field" style="margin-bottom:0"><label>评论内容不包含（任意一个都不能有，英文逗号分隔）</label>
            <input type="text" id="xhscap-excludeKeywords"></div>
        </div>
      </div>
      <div id="xhscap-progress">
        <div class="xhscap-prow"><span>状态</span><span id="xhscap-pstatus">-</span></div>
        <div class="xhscap-prow"><span>当前关键词</span><span id="xhscap-pkeyword">-</span></div>
        <div class="xhscap-prow"><span>关键词进度</span><span id="xhscap-pkeywordProgress">-</span></div>
        <div class="xhscap-prow"><span>帖子进度</span><span id="xhscap-pvideoProgress">-</span></div>
        <div class="xhscap-prow"><span>评论进度</span><span id="xhscap-pcommentProgress">-</span></div>
        <div id="xhscap-bar-wrap"><div id="xhscap-bar"></div></div>
      </div>
      <div style="color:#999;font-size:11px;margin-top:6px">
        界面与工具模块开源（MIT）· 核心引擎闭源 · 仅供学习交流，请遵守平台规则与法律法规
      </div>
    </div>
    <button id="xhscap-fab" title="展开面板">📕</button>
  `;

  const $id = (id) => root.querySelector('#' + id);

  function build() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    root = document.createElement('div');
    root.id = 'xhscap-root';
    root.innerHTML = HTML;
    document.body.appendChild(root);
    ['keywords', 'postType', 'sort', 'noteType', 'time', 'range', 'location', 'videosPerKeyword',
      'likeBeforeComment', 'collectBeforeComment', 'commentMode', 'commentType', 'comments',
      'aiModel', 'apiKey', 'aiBaseUrl', 'aiCustomModel', 'aiPrompt', 'commentsPerVideo',
      'commentInterval', 'includeKeywords', 'excludeKeywords'].forEach((k) => (els[k] = $id('xhscap-' + k)));
    statusEl = $id('xhscap-status');
    progressEl = $id('xhscap-progress');
    bindEvents();
    loadConfig();
    refreshCommentType();
    refreshAIModel();
    refreshCommentMode();
    restoreProgress();
  }

  function toggleCollapse() {
    const body = $id('xhscap-body');
    const fab = $id('xhscap-fab');
    const hidden = body.classList.toggle('hidden');
    $id('xhscap-toggle').textContent = hidden ? '＋' : '－';
    fab.style.display = hidden ? 'block' : 'none';
  }

  function setupDrag() {
    let drag = null;
    const header = $id('xhscap-header');
    header.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('button')) return;
      const rect = root.getBoundingClientRect();
      drag = { startX: e.clientX, startY: e.clientY, origLeft: rect.left, origTop: rect.top, moved: false };
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      drag.moved = true;
      const left = Math.max(0, Math.min(drag.origLeft + dx, window.innerWidth - 80));
      const top = Math.max(0, Math.min(drag.origTop + dy, window.innerHeight - 40));
      root.style.left = left + 'px';
      root.style.top = top + 'px';
      root.style.right = 'auto';
    });
    window.addEventListener('mouseup', () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (moved) {
        const rect = root.getBoundingClientRect();
        store.set('panelPos', { left: rect.left, top: rect.top });
      } else {
        toggleCollapse();
      }
    });
    const saved = store.get('panelPos');
    if (saved && typeof saved.left === 'number') {
      root.style.left = Math.max(0, Math.min(saved.left, window.innerWidth - 80)) + 'px';
      root.style.top = Math.max(0, Math.min(saved.top, window.innerHeight - 40)) + 'px';
      root.style.right = 'auto';
    }
  }

  function bindEvents() {
    $id('xhscap-fab').addEventListener('click', () => {
      $id('xhscap-body').classList.remove('hidden');
      $id('xhscap-fab').style.display = 'none';
      $id('xhscap-toggle').textContent = '－';
    });
    setupDrag();
    els.commentType.addEventListener('change', refreshCommentType);
    els.aiModel.addEventListener('change', refreshAIModel);
    els.commentMode.addEventListener('change', refreshCommentMode);
    $id('xhscap-save').addEventListener('click', () => {
      const { settings: s, error } = collectSettings(false);
      if (error) return setStatus(error, 'error');
      store.set('settings', s);
      setStatus('配置已保存', 'success');
    });
    $id('xhscap-start').addEventListener('click', () => {
      if (store.get('taskRunning', false)) return setStatus('任务已在运行中，请先停止', 'error');
      const { settings: s, error } = collectSettings(true);
      if (error) return setStatus(error, 'error');
      store.set('settings', s);
      const res = startTask(s);
      if (res.success) setStatus('任务已开始，正在打开页面...', 'success');
      else setStatus(res.message, 'error');
    });
    $id('xhscap-stop').addEventListener('click', () => {
      stopTask();
    });
  }

  function collectSettings(forStart) {
    const filters = {};
    if (els.sort.value) filters.sort = els.sort.value;
    if (els.noteType.value) filters.noteType = els.noteType.value;
    if (els.time.value) filters.time = els.time.value;
    if (els.range.value) filters.range = els.range.value;
    if (els.location.value) filters.location = els.location.value;
    const s = {
      keywords: normalizeCommas(els.keywords.value.trim()),
      postType: els.postType.value,
      filters,
      comments: els.comments.value.trim(),
      commentMode: els.commentMode.value,
      commentsPerVideo: parseInt(els.commentsPerVideo.value) || 3,
      videosPerKeyword: parseInt(els.videosPerKeyword.value) || 2,
      commentInterval: parseInt(els.commentInterval.value) || 3,
      commentType: els.commentType.value,
      aiModel: els.aiModel.value,
      aiBaseUrl: els.aiBaseUrl.value.trim(),
      aiCustomModel: els.aiCustomModel.value.trim(),
      apiKey: els.apiKey.value,
      aiPrompt: els.aiPrompt.value,
      likeBeforeComment: els.likeBeforeComment.checked,
      collectBeforeComment: els.collectBeforeComment.checked,
      commentIncludeKeywords: els.includeKeywords.value.trim(),
      commentExcludeKeywords: els.excludeKeywords.value.trim(),
    };
    if (forStart) {
      if (!s.keywords) return { error: '请输入搜索关键词' };
      if (s.commentType === 'text' && !s.comments) return { error: '请输入评论文本内容' };
      if (s.commentType === 'ai') {
        if (s.aiModel !== 'ollama' && !s.apiKey) return { error: '请输入API Key' };
        if (!s.aiPrompt) return { error: '请输入AI回复提示词' };
      }
      if (s.commentType === 'emoji' && !s.comments) s.comments = '[微笑]';
    }
    return { settings: s };
  }

  function loadConfig() {
    const s = store.get('settings');
    if (!s) {
      els.aiPrompt.value = DEFAULT_PROMPT;
      setStatus('首次使用，请先配置参数', 'success');
      return;
    }
    els.keywords.value = s.keywords || '';
    els.postType.value = s.postType || 'all';
    els.sort.value = (s.filters && s.filters.sort) || '';
    els.noteType.value = (s.filters && s.filters.noteType) || '';
    els.time.value = (s.filters && s.filters.time) || '';
    els.range.value = (s.filters && s.filters.range) || '';
    els.location.value = (s.filters && s.filters.location) || '';
    els.videosPerKeyword.value = s.videosPerKeyword || 2;
    els.likeBeforeComment.checked = s.likeBeforeComment || false;
    els.collectBeforeComment.checked = s.collectBeforeComment || false;
    els.commentMode.value = s.commentMode || 'reply';
    els.commentType.value = s.commentType || 'emoji';
    els.comments.value = s.comments || '';
    els.commentsPerVideo.value = s.commentsPerVideo || 3;
    els.commentInterval.value = s.commentInterval || 3;
    els.aiModel.value = s.aiModel || 'deepseek';
    els.aiBaseUrl.value = s.aiBaseUrl || '';
    els.aiCustomModel.value = s.aiCustomModel || '';
    els.apiKey.value = s.apiKey || s.aiApiKey || '';
    els.aiPrompt.value = s.aiPrompt || DEFAULT_PROMPT;
    els.includeKeywords.value = s.commentIncludeKeywords || '';
    els.excludeKeywords.value = s.commentExcludeKeywords || '';
  }

  function refreshCommentType() {
    const t = els.commentType.value;
    els.comments.parentElement.style.display = t === 'text' ? 'block' : 'none';
    $id('xhscap-ai-group').style.display = t === 'ai' ? 'block' : 'none';
  }
  function refreshAIModel() {
    const isOllama = els.aiModel.value === 'ollama';
    $id('xhscap-baseUrl-group').style.display = isOllama ? 'block' : 'none';
    $id('xhscap-customModel-group').style.display = isOllama ? 'block' : 'none';
    els.apiKey.parentElement.style.display = isOllama ? 'none' : 'block';
  }
  function refreshCommentMode() {
    const isReply = els.commentMode.value !== 'direct';
    $id('xhscap-reply-filter-group').style.display = isReply ? 'block' : 'none';
  }

  function setStatus(text, type = '') {
    statusEl.textContent = text;
    statusEl.className = type;
  }

  function onTaskStarted() {
    progressEl.style.display = 'block';
    $id('xhscap-pstatus').textContent = '运行中';
    $id('xhscap-pstatus').style.color = '#2196f3';
    $id('xhscap-bar').style.background = '#2196f3';
    setStatus('任务正在运行中', 'success');
    updateProgress(store.get('taskProgress') || {});
  }

  function updateProgress(progress) {
    const s = store.get('settings');
    if (!s || !progressEl) return;
    progressEl.style.display = 'block';
    const keywords = s.keywords.split(',').map((x) => x.trim()).filter(Boolean);
    const kwTotal = keywords.length;
    const vpk = s.videosPerKeyword || 2;
    const cpv = s.commentsPerVideo || 3;
    const videoTotal = kwTotal * vpk;
    const commentTotal = kwTotal * vpk * cpv;
    const videoDone = (progress.keywordIndex || 0) * vpk + (progress.videoIndex || 0);
    const commentDone =
      (progress.keywordIndex || 0) * vpk * cpv + (progress.videoIndex || 0) * cpv + (progress.commentedCount || 0);
    $id('xhscap-pstatus').textContent = '运行中';
    $id('xhscap-pkeyword').textContent = keywords[progress.keywordIndex || 0] || '-';
    $id('xhscap-pkeywordProgress').textContent = (progress.keywordIndex || 0) + 1 + '/' + kwTotal;
    $id('xhscap-pvideoProgress').textContent = videoDone + '/' + videoTotal;
    $id('xhscap-pcommentProgress').textContent = commentDone + '/' + commentTotal;
    $id('xhscap-bar').style.width = (commentTotal > 0 ? (commentDone / commentTotal) * 100 : 0) + '%';
  }

  function onComplete(data) {
    $id('xhscap-pstatus').textContent = '已完成';
    $id('xhscap-pstatus').style.color = '#4caf50';
    $id('xhscap-bar').style.background = '#4caf50';
    $id('xhscap-bar').style.width = '100%';
    setStatus('所有任务已完成！总评论数：' + data.totalComments, 'success');
  }

  function restoreProgress() {
    if (store.get('taskRunning', false)) {
      onTaskStarted();
    }
  }

  return { setStatus, updateProgress, onTaskStarted, onComplete, build };
})();
