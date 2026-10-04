import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [NgOptimizedImage],
  template: `
    <header class="bg-white shadow-[0px_1px_4px_rgba(0,0,0,0.04)] flex h-16 items-center justify-between px-6">
      <div class="flex items-center gap-5">
        <div class="bg-[#0f2744] rounded-[8.6px] size-[35px] flex items-center justify-center shadow-[0px_0.86px_0.86px_rgba(0,0,0,0.05)] shrink-0 overflow-hidden">
          <img ngSrc="assets/logo.svg" width="35" height="35" alt="" priority class="size-full" />
        </div>
        <span class="font-['Space_Grotesk'] font-bold text-[#0f2744] text-[20px] tracking-[-0.76px] leading-none select-none">
          SAFEPLANT
        </span>
      </div>
    </header>
  `,
  host: { class: 'block' },
})
export class Header {}
